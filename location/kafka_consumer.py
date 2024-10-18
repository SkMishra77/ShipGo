import json

from aiokafka import AIOKafkaConsumer
from h3 import latlng_to_cell
from redis.asyncio import Redis

KAFKA_BROKER = 'localhost:9092'
redis = Redis(host="127.0.0.1", port=6379, decode_responses=True)


async def consume_driver_location(TOPIC_NAME='driver-location'):
    consumer = AIOKafkaConsumer(
        TOPIC_NAME,
        bootstrap_servers=KAFKA_BROKER,
        group_id="driver-location-consumer",
        value_deserializer=lambda m: json.loads(m.decode('utf-8')),
    )
    await consumer.start()
    print('Diver Locations Consumer Started')
    try:
        async for message in consumer:
            driverId = message.value.get("DriverId")
            lat = float(message.value.get("lat"))
            lng = float(message.value.get("lng"))
            Resolution = 8
            h3_index = latlng_to_cell(lat, lng, Resolution)
            print("h3 index",h3_index)
            prev_location: str | None = await redis.get(f'{driverId}_location')
            if prev_location is not None:
                prev_lat, prev_lng = list(map(float, prev_location.split(':')))
                h3_index_prev = latlng_to_cell(prev_lat, prev_lng, Resolution)
                if h3_index_prev != h3_index:
                    await redis.srem(f'{h3_index_prev}_h3', driverId)

            await redis.set(f'{driverId}_location', f'{lat}:{lng}')
            await redis.sadd(f'{h3_index}_h3', f'{driverId}')

    finally:
        await consumer.stop()
