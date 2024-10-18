from datetime import datetime

from bson import ObjectId
from pydantic import BaseModel, EmailStr


class DriverModel(BaseModel):
    DriverID: str
    Name: str
    Phone: str
    Email: EmailStr
    Password: str
    VehicleType: str
    VehicleNumber: str
    LicenseNumber: str
    VehicleMaxCapacity: str
    CreatedAt: datetime
    UpdatedAt: datetime

    class Config:
        json_encoders = {ObjectId: str}
