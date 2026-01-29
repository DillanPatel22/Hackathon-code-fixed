from django.contrib.auth.models import User
from rest_framework import serializers
from django.contrib.auth import authenticate
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    is_admin = serializers.BooleanField(required=False, default=False)

    class Meta:
        model = User
        fields = ("username", "email", "password", "is_admin")

    def create(self, validated_data):
        is_admin = validated_data.pop('is_admin', False)
        
        user = User.objects.create_user(
            username=validated_data["username"],
            email=validated_data["email"],
            password=validated_data["password"],
        )
        
        # Set admin privileges if specified
        if is_admin:
            user.is_staff = True
            user.is_superuser = True
            user.save()
        
        return user

class LoginSerializer(TokenObtainPairSerializer):
    username_field = "username"

    def validate(self, attrs):
        username_or_email = attrs.get("username")
        password = attrs.get("password")

        user = authenticate(
            request=self.context.get("request"),
            username=username_or_email,
            password=password,
        )

        # Try email login if username fails
        if not user:
            try:
                from django.contrib.auth.models import User
                user_obj = User.objects.get(email=username_or_email)
                user = authenticate(
                    request=self.context.get("request"),
                    username=user_obj.username,
                    password=password,
                )
            except User.DoesNotExist:
                pass

        if not user:
            raise ValueError("Invalid credentials")

        data = super().validate({
            "username": user.username,
            "password": password,
        })

        # Add user information including admin status
        data["user"] = {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "is_admin": user.is_staff or user.is_superuser,  # Check if user is admin
        }
        
        return data