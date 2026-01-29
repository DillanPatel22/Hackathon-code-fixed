# orders/authentication.py
import jwt
from rest_framework import authentication, exceptions
from django.conf import settings

class JWTAuthenticationWithoutUserDB(authentication.BaseAuthentication):
    def authenticate(self, request):
        auth_header = request.headers.get("Authorization")
        if not auth_header:
            return None
        try:
            prefix, token = auth_header.split(" ")
            if prefix.lower() != "bearer":
                return None
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
            user_id = payload.get("user_id")
            if not user_id:
                raise exceptions.AuthenticationFailed("Invalid token payload")

            # dummy user object
            class DummyUser:
                id = user_id
                @property
                def is_authenticated(self):
                    return True  # <--- Add this
            return (DummyUser(), None)
        except jwt.ExpiredSignatureError:
            raise exceptions.AuthenticationFailed("Token expired")
        except jwt.InvalidTokenError:
            raise exceptions.AuthenticationFailed("Invalid token")
