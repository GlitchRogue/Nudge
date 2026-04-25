from jose import jwt
from datetime import datetime, timedelta

SECRET_KEY = "event_ai_secret_key"
ALGORITHM = "HS256"


fake_users = {
    "zubair": {
        "username": "zubair",
        "password": "1234"
    }
}


def authenticate_user(username, password):
    user = fake_users.get(username)
    if not user:
        return False

    if user["password"] != password:
        return False

    return True


def create_access_token(username):
    payload = {
        "sub": username,
        "exp": datetime.utcnow() + timedelta(hours=2)
    }

    token = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)
    return token