import hashlib
import os


def hash_password(password: str) -> str:
    """Hash the password using PBKDF2 with a random salt."""
    salt = os.urandom(16)
    hashed = hashlib.pbkdf2_hmac('sha256', password.encode(), salt, 100000)
    return salt.hex() + ":" + hashed.hex()


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify the password by comparing it with the stored hash."""
    salt, stored_hash = hashed_password.split(':')
    salt = bytes.fromhex(salt)
    stored_hash = bytes.fromhex(stored_hash)
    new_hash = hashlib.pbkdf2_hmac('sha256', plain_password.encode(), salt, 100000)
    return new_hash == stored_hash
