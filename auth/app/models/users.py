from datetime import datetime

from bson import ObjectId
from pydantic import BaseModel, EmailStr


class UserModel(BaseModel):
    UserId: str
    Name: str
    Phone: str
    Email: EmailStr
    Password: str
    CreatedAt: datetime
    UpdatedAt: datetime

    class Config:
        json_encoders = {ObjectId: str}
