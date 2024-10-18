from typing import List, Optional

from pydantic import BaseModel


class Bookings(BaseModel):
    BookingId: int
    UserId: str
    DriverId: Optional[str] = None
    origin: List[float]
    destination: List[float]
    Status: str
    Price: Optional[float] = None
    Logistics_load: float
