import asyncio
from contextlib import asynccontextmanager

import h3
from fastapi import FastAPI
from redis.asyncio import Redis
from starlette.responses import StreamingResponse
from starlette.websockets import WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from kafka_consumer import consume_bookings, consume_booking_accept
from kafka_producer import producer, send_message_to_kafka
from schemas import LocationRequest
from utils import get_distance, get_active_drivers_cnt, res_func, get_server_id, subscribe_channel

redis = Redis(host="127.0.0.1", port=6379, decode_responses=True)
Resolution = 8
server_hash = get_server_id()


class ConnectionManager:
    def __init__(self, redis_conn: Redis):
        self.redis = redis_conn
        self.active_connections = {}

    async def connect(self, UserId: str, websocket: WebSocket):
        await websocket.accept()
        self.active_connections[UserId] = websocket
        await self.redis.set(f'{UserId}_server', server_hash)

    async def send_message(self, UserId: str, message: dict):
        websocket = self.active_connections.get(UserId)
        if websocket:
            await websocket.send_json(message)

    async def disconnect(self, UserId: str):
        self.active_connections.pop(UserId, None)
        await self.redis.delete(f'{UserId}_server')


manager = ConnectionManager(redis)


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Starting Kafka producer...")
    await producer.start()  # Start the Kafka producer
    task = asyncio.create_task(consume_bookings())
    task2 = asyncio.create_task(subscribe_channel(manager, redis, server_hash))
    task3 = asyncio.create_task(consume_booking_accept())
    try:
        yield
    finally:
        print("Stopping Kafka producer...")
        await producer.stop()
        task.cancel()
        task2.cancel()
        task3.cancel()


app = FastAPI(lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows requests from all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all HTTP methods
    allow_headers=["*"],  # Allows all HTTP headers
)

@app.post("/get_price")
async def get_price(location: LocationRequest):
    distance, time = get_distance(location.origin, location.destination)
    distance = float(distance.split(' ')[0])
    h3_index = h3.latlng_to_cell(location.origin[0], location.origin[1], Resolution)
    neighbour = h3.grid_disk(h3_index, k=2)
    active_drivers = await get_active_drivers_cnt(redis, neighbour)
    if active_drivers == 0:
        return res_func(1, {
            "price": None,
            "distance": distance,
            "time": time,
            "message": "No Active Driver Found in the Region"
        }, 200)
    else:
        price = int(distance * 10 + 100 + (distance * 5) / active_drivers)
    return res_func(1, {
        "price": price,
        "distance": distance,
        "time": time,
        "message": None
    }, 200)


@app.websocket("/ws/booking")
async def booking(websocket: WebSocket, UserId: str):
    await manager.connect(UserId, websocket)
    try:
        while True:
            data = await websocket.receive_json()
            if data.get('action') == "booking":
                data.update({'UserId': UserId})
                await send_message_to_kafka(TOPIC_NAME='bookings', message=data)
    except WebSocketDisconnect:
        await manager.disconnect(UserId)


async def redis_live_location_stream(BookingId: str):
    pubsub = redis.pubsub()
    await pubsub.subscribe(BookingId)
    try:
        while True:
            message = await pubsub.get_message(ignore_subscribe_messages=True, timeout=1.0)
            if message:
                data = message["data"]
                yield f"data: {data}\n\n"
            await asyncio.sleep(0.1)
    finally:
        await pubsub.unsubscribe(BookingId)
        await pubsub.close()


@app.get("/subscribe/{BookingId}")
async def subscribe_to_channel(BookingId: str):
    return StreamingResponse(redis_live_location_stream(BookingId), media_type="text/event-stream")
