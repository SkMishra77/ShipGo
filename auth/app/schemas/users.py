from datetime import datetime

from pydantic import BaseModel, EmailStr

from app.models.users import UserModel
from app.utils.distributed_id_generator import generate_id


class UserCreate(BaseModel):
    Name: str
    Phone: str
    Email: EmailStr
    Password: str


def get_user_model_obj(user: UserCreate):
    user_data = {
        "Name": user.Name,
        "Phone": user.Phone,
        "Email": user.Email,
        "Password": user.Password,
        "UserId": "U" + generate_id(),
        "CreatedAt": datetime.now(),
        "UpdatedAt": datetime.now(),
    }
    return UserModel(**user_data)
