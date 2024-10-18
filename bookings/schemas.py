from typing import List

from pydantic import BaseModel


class LocationRequest(BaseModel):
    origin: List[float]
    destination: List[float]
