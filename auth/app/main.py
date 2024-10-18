from fastapi import FastAPI
from fastapi import Request
from motor.motor_asyncio import AsyncIOMotorClient

from app.config import settings
from app.routes.auth import router as auth_router
from app.utils.jwt import jwt_required

app = FastAPI()


def startup_db_client():
    app.mongodb_client = AsyncIOMotorClient(settings.mongo_uri)
    app.mongodb = app.mongodb_client[settings.mongo_db_name]


startup_db_client()


@app.get('/health')
# @jwt_required
async def health(request: Request):
    return {'status': 'ok'}


app.include_router(auth_router, prefix="/api", tags=["auth"])
