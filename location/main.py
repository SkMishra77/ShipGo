import asyncio
import json
from contextlib import asynccontextmanager

from fastapi import FastAPI
from h3 import latlng_to_cell
from redis.asyncio import Redis
from starlette.websockets import WebSocket, WebSocketDisconnect

from kafka_consumer import consume_driver_location
from kafka_producer import send_message_to_kafka, producer
from utils import get_server_id, subscribe_channel

redis = Redis(host="127.0.0.1", port=6379, decode_responses=True)

server_hash = get_server_id()


class ConnectionManager:
    def __init__(self, redis_conn: Redis):
        self.redis = redis_conn
        self.active_connections = {}

    async def connect(self, driverId: str, websocket: WebSocket):
        await websocket.accept()
        self.active_connections[driverId] = websocket
        await self.redis.set(f'{driverId}_server', server_hash)

    async def send_message(self, driverId: str, message: dict):
        websocket = self.active_connections.get(driverId)
        if websocket:
            await websocket.send_json(message)

    async def disconnect(self, driverId: str):
        self.active_connections.pop(driverId, None)
        await self.redis.delete(f'{driverId}_server')
        Resolution = 8
        location: str | None = await redis.get(f'{driverId}_location')
        if location:
            lat, lng = list(map(float, location.split(':')))
            h3_index_curr = latlng_to_cell(lat, lng, Resolution)
            await self.redis.delete(f'{driverId}_location')
            await redis.srem(f'{h3_index_curr}_h3', driverId)


manager = ConnectionManager(redis)


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Starting Kafka producer...")
    await producer.start()  # Start the Kafka producer
    task = asyncio.create_task(subscribe_channel(manager, redis, server_hash))
    task2 = asyncio.create_task(consume_driver_location())
    try:
        yield
    finally:
        print("Stopping Kafka producer...")
        await producer.stop()
        task2.cancel()
        task.cancel()


app = FastAPI(lifespan=lifespan)


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket, driverId: str):
    await manager.connect(driverId, websocket)
    try:
        while True:
            data = await websocket.receive_json()
            data['DriverId'] = driverId
            if data.get('action') == "location_update":
                await send_message_to_kafka(TOPIC_NAME='driver-location', message=data)
            elif data.get('action') == "booking-accept":
                await send_message_to_kafka(TOPIC_NAME='booking-accept', message=data)
            elif data.get('action') == "trip-update":
                await send_message_to_kafka(TOPIC_NAME='driver-location', message=data)
                await redis.publish(data['BookingId'], json.dumps(data))

    except WebSocketDisconnect:
        await manager.disconnect(driverId)
