from datetime import datetime

from pydantic import BaseModel, EmailStr

from app.models.drivers import DriverModel
from app.utils.distributed_id_generator import generate_id


class DriverCreate(BaseModel):
    Name: str
    Phone: str
    Email: EmailStr
    Password: str
    VehicleType: str
    VehicleNumber: str
    LicenseNumber: str
    VehicleMaxCapacity: str


def get_driver_model_obj(driver: DriverCreate):
    driver_obj = {
        "Name": driver.Name,
        "Phone": driver.Phone,
        "Email": driver.Email,
        "Password": driver.Password,
        "VehicleType": driver.VehicleType,
        "VehicleNumber": driver.VehicleNumber,
        "VehicleMaxCapacity": driver.VehicleMaxCapacity,
        "LicenseNumber": driver.LicenseNumber,
        "DriverID": "D" + generate_id(),
        "CreatedAt": datetime.now(),
        "UpdatedAt": datetime.now()
    }
    return DriverModel(**driver_obj)
