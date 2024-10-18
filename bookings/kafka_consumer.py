import json
from random import randint

import h3
from aiokafka import AIOKafkaConsumer
from motor.motor_asyncio import AsyncIOMotorClient
from redis.asyncio import Redis
from snowflake import SnowflakeGenerator

import config
from model import Bookings
from utils import get_active_drivers, get_driver_server_id

Resolution = 8
KAFKA_BROKER = 'localhost:9092'
redis = Redis(host="127.0.0.1", port=6379, decode_responses=True)
gen = SnowflakeGenerator(randint(1, 100))


async def startup_db_client():
    return AsyncIOMotorClient(config.mongo_uri)[config.mongo_db_name]


async def consume_bookings(TOPIC_NAME='bookings'):
    consumer = AIOKafkaConsumer(
        TOPIC_NAME,
        bootstrap_servers=KAFKA_BROKER,
        group_id="booking-consumer",
        value_deserializer=lambda m: json.loads(m.decode('utf-8')),
    )
    await consumer.start()
    print('Booking Locations Consumer Started')
    try:
        async for message in consumer:
            data = message.value
            print(data)
            origin = data['origin']
            h3_index = h3.latlng_to_cell(origin[0], origin[1], Resolution)
            neighbour = h3.grid_disk(h3_index, k=2)
            active_drivers = await get_active_drivers(redis, neighbour)
            driver_with_serverId = await get_driver_server_id(redis, list(active_drivers))
            data = {
                'BookingId': next(gen),
                **{'DriverId': None, **data},
                "Status": "Driver Unassigned",
            }
            booking_obj = Bookings(**data)
            db = await startup_db_client()
            data = booking_obj.model_dump()
            data['action'] = 'booking-notify'
            data['BookingId'] = str(data['BookingId'])
            await db["bookings"].insert_one(booking_obj.model_dump(by_alias=True))
            print(driver_with_serverId)
            for driver, driver_server_id in driver_with_serverId:
                data['DriverId'] = driver
                print(await redis.publish(driver_server_id, json.dumps(data)))
    except Exception as e:
        print(e)
    finally:
        await consumer.stop()


async def consume_booking_accept(TOPIC_NAME='booking-accept'):
    db = await startup_db_client()
    consumer = AIOKafkaConsumer(
        TOPIC_NAME,
        bootstrap_servers=KAFKA_BROKER,
        group_id="booking-accept-consumer",
        value_deserializer=lambda m: json.loads(m.decode('utf-8')),
    )
    await consumer.start()
    print('Booking Accept Consumer Started')
    try:
        async for message in consumer:
            DriverId = message.value.get("DriverId")
            UserId = message.value.get("UserId")
            BookingId = message.value.get("BookingId")
            value = message.value
            print(value)
            is_acquired = await redis.set(f'{BookingId}_lock', 1, ex=30, nx=True)
            data = await db["bookings"].find_one({'BookingId': int(BookingId)})
            print(data, 1)
            current_driver = data['DriverId']
            if current_driver is None and is_acquired:
                await db['bookings'].update_one({'BookingId': data['BookingId']},
                                                {'$set': {'Status': 'Driver Assigned',
                                                          'DriverId': value['DriverId']}})
                driver_server_id = await redis.get(f'{DriverId}_server')
                user_server_id = await redis.get(f'{UserId}_server')
                # await redis.sadd('busy_driver', DriverId)
                value['action'] = 'trip-start'
                await redis.publish(driver_server_id, json.dumps(value))
                await redis.publish(user_server_id, json.dumps(value))

                # TODO send cancel booking event to drivers

            else:
                serverId = await redis.get(f'{DriverId}_server')
                await redis.publish(serverId, json.dumps({
                    'BookingId': BookingId,
                    'action': 'booking-cancel',
                    'message': 'Another Driver Assigned'
                }))
    except Exception as e:
        print(e)
    finally:
        await consumer.stop()
