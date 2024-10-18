from motor.motor_asyncio import AsyncIOMotorDatabase

from app.models.drivers import DriverModel
from app.utils.hashing import hash_password


async def create_driver(db: AsyncIOMotorDatabase, driver: DriverModel):
    driver.Password = hash_password(driver.Password)
    result = await db["drivers"].insert_one(driver.model_dump(by_alias=True))
    return driver


async def get_driver_by_email_or_phone(db: AsyncIOMotorDatabase, email: str, phone: str) -> DriverModel:
    return await db["drivers"].find_one({"Email": email, "Phone": phone})


async def get_driver_by_email(db: AsyncIOMotorDatabase, email: str) -> DriverModel:
    return await db["drivers"].find_one({"Email": email})
