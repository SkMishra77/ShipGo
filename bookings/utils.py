import json
import socket
import uuid
from typing import List

import requests
from motor.motor_asyncio import AsyncIOMotorClient
from redis.asyncio import Redis

import config
from config import *


def get_distance(origin, destination):
    url = "https://maps.googleapis.com/maps/api/distancematrix/json"
    params = {
        "origins": f"{origin[0]},{origin[1]}",
        "destinations": f"{destination[0]},{destination[1]}",
        "key": GOOGLE_DISTANCE_API_KEY,
        "mode": "driving",
    }

    response = requests.get(url, params=params)
    result = response.json()

    if result["status"] == "OK":
        element = result["rows"][0]["elements"][0]
        if element["status"] == "OK":
            distance_text = element["distance"]["text"]
            duration_value = element["duration"]["text"]
            return distance_text, duration_value
        else:
            raise Exception(f"Error: {element['status']}")
    else:
        raise Exception(f"Error: {result['status']}")


async def get_active_drivers_cnt(redis: Redis, h3_neigh):
    keys = [f"{key}_h3" for key in h3_neigh]
    driver_list = await redis.sunion(*keys)
    busy_drivers = await redis.smembers('busy_driver')
    driver_list = set(driver_list) - busy_drivers
    return len(driver_list)


async def get_active_drivers(redis: Redis, h3_neigh):
    keys = [f"{key}_h3" for key in h3_neigh]
    driver_list = await redis.sunion(*keys)
    busy_drivers = await redis.smembers('busy_driver')
    driver_list = set(driver_list) - busy_drivers
    return driver_list


async def get_driver_server_id(redis: Redis, drivers_available: List[str]):
    pipeline = redis.pipeline()
    for key in drivers_available:
        await pipeline.get(f'{key}_server')
    result = await pipeline.execute()
    return list(zip(drivers_available, result))


def res_func(status, message, status_code):
    return {
        "error": True if status == 0 else False,
        "data": message,
        "status_code": status_code,
    }


def get_server_id():
    hostname = socket.gethostname()
    mac = uuid.uuid4()
    unique_string = f"{hostname}-{mac}"
    return unique_string


async def subscribe_channel(manager, redis, server_id):
    async def startup_db_client():
        return AsyncIOMotorClient(config.mongo_uri)[config.mongo_db_name]

    pubsub = redis.pubsub()
    await pubsub.subscribe(server_id)
    print(f"Subscribed to Redis channel: {server_id}")
    try:
        async for message in pubsub.listen():
            if message["type"] == "message":
                data = json.loads(message["data"])
                await manager.send_message(data['UserId'], data)
    finally:
        await pubsub.unsubscribe(server_id)
