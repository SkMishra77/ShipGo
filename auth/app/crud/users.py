from motor.motor_asyncio import AsyncIOMotorDatabase

from app.models.users import UserModel
from app.utils.hashing import hash_password


async def create_user(db: AsyncIOMotorDatabase, user: UserModel):
    user.Password = hash_password(user.Password)
    result = await db["users"].insert_one(user.model_dump(by_alias=True))
    return user


async def get_user_by_email_or_phone(db: AsyncIOMotorDatabase, email: str, phone: str):
    return await db["users"].find_one({"Email": email, "Phone": phone})


async def get_user_by_email(db: AsyncIOMotorDatabase, email: str):
    return await db["users"].find_one({"Email": email})
