import json

from aiokafka import AIOKafkaProducer

KAFKA_BROKER = 'localhost:9092'

producer = AIOKafkaProducer(bootstrap_servers=KAFKA_BROKER)


async def start_producer():
    await producer.start()


async def send_message_to_kafka(TOPIC_NAME: str, message: dict):
    message = json.dumps(message).encode('UTF-8')
    await producer.send(TOPIC_NAME, message)
