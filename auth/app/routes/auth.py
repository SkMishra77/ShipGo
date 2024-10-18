from fastapi import APIRouter, Depends, Body
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.crud.drivers import create_driver, get_driver_by_email_or_phone, get_driver_by_email
from app.crud.users import create_user, get_user_by_email_or_phone, get_user_by_email
from app.schemas.drivers import DriverCreate, get_driver_model_obj
from app.schemas.users import UserCreate, get_user_model_obj
from app.utils.custom_response import res_func
from app.utils.hashing import verify_password
from app.utils.jwt import create_access_token

router = APIRouter()


def get_db():
    from fastapi import Request
    def _get_db(request: Request) -> AsyncIOMotorDatabase:
        return request.app.mongodb

    return _get_db


@router.post("/register/user")
async def register_user(user: UserCreate, db: AsyncIOMotorDatabase = Depends(get_db())):
    existing_rider = await get_user_by_email_or_phone(db, user.Email, user.Phone)
    if existing_rider:
        return res_func(0, "Email or Phone already registered", 400)
    user = get_user_model_obj(user)
    await create_user(db, user)
    return res_func(1, "User registered successfully", 200)


@router.post("/register/driver")
async def register_driver(driver: DriverCreate, db: AsyncIOMotorDatabase = Depends(get_db())):
    existing_driver = await get_driver_by_email_or_phone(db, driver.Email, driver.Phone)
    if existing_driver:
        return res_func(0, "Email or Phone already registered", 400)
    driver = get_driver_model_obj(driver)
    await create_driver(db, driver)
    return res_func(1, "Driver registered successfully", 200)


@router.post("/login/user")
async def login_rider(email: str = Body(...), password: str = Body(...), db: AsyncIOMotorDatabase = Depends(get_db())):
    user = await get_user_by_email(db, email)
    if not user or not verify_password(password, user["Password"]):
        return res_func(0, "Invalid credentials", 401)
    token = create_access_token({"sub": user["UserId"]})
    return res_func(1, {"access_token": token, "token_type": "bearer", "Type": "User"}, 200)


@router.post("/login/driver")
async def login_driver(email: str = Body(...), password: str = Body(...), db: AsyncIOMotorDatabase = Depends(get_db())):
    driver = await get_driver_by_email(db, email)
    if not driver or not verify_password(password, driver["Password"]):
        return res_func(0, "Invalid credentials", 401)
    print(driver)
    token = create_access_token({"sub": driver["DriverID"]})
    return res_func(1, {"access_token": token, "token_type": "bearer", "Type": "Driver"}, 200)
