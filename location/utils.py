import json
import socket
import uuid


def get_server_id():
    hostname = socket.gethostname()
    mac = uuid.uuid4()
    unique_string = f"{hostname}-{mac}"
    return unique_string


async def subscribe_channel(manager, redis, server_hash):
    pubsub = redis.pubsub()
    await pubsub.subscribe(server_hash)
    print(f"Subscribed to Redis channel: {server_hash}")
    try:
        async for message in pubsub.listen():
            if message["type"] == "message":
                data = json.loads(message["data"])
                print(data)
                await manager.send_message(data['DriverId'], data)
    finally:
        await pubsub.unsubscribe(server_hash)
