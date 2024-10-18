import hashlib
import random
import socket
import time

CHARSET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"


def get_dynamic_shard_id():
    """Generates a unique shard ID based on the machine's IP address."""
    hostname = socket.gethostname()
    ip_address = socket.gethostbyname(hostname)

    hash_value = hashlib.md5(ip_address.encode()).hexdigest()

    shard_index = int(hash_value[:2], 16) % len(CHARSET)
    return CHARSET[shard_index]


def encode_number_to_char(num):
    """Encodes a number to a character from the 62-char set."""
    return CHARSET[num % 62]


def random_suffix(length=2):
    """Generates a random suffix of given length from the 62-char set."""
    return ''.join(random.choice(CHARSET) for _ in range(length))


def generate_id():
    """Generates a 5-character distributed ID with dynamic shard ID."""
    shard_id = get_dynamic_shard_id()
    timestamp = int(time.time() * 1000)  # Milliseconds since epoch
    time_encoded = encode_number_to_char(timestamp)
    suffix = random_suffix(2)
    return f"{shard_id}{time_encoded}{suffix}"
