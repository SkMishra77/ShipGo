from datetime import datetime, timedelta
from functools import wraps
from typing import Callable

from fastapi import Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from app.utils.custom_response import res_func
from app.config import settings

oauth2_scheme = HTTPBearer()


def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(hours=settings.jwt_expiration_hours)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)


def jwt_required(func: Callable):
    """Decorator to check JWT token validity and user state."""

    @wraps(func)
    async def wrapper(request: Request, *args, **kwargs):
        # Extract the token from the Authorization header
        credentials: HTTPAuthorizationCredentials = await oauth2_scheme(request)
        token = credentials.credentials

        try:
            # Decode the JWT token
            payload = jwt.decode(
                token,
                settings.jwt_secret_key,
                algorithms=[settings.jwt_algorithm]
            )

            # Check for token expiration
            if payload.get("exp") < datetime.utcnow().timestamp():
                return res_func(0, "Token Expired", 403)
            request.state.user = payload

        except JWTError:
            return res_func(0, "Token Invalid", 422)

        return await func(request, *args, **kwargs)

    return wrapper
