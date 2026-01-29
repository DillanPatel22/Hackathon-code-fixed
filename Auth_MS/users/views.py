from rest_framework import generics, permissions
from django.contrib.auth.models import User
from .serializers import RegisterSerializer, LoginSerializer
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer


class ProfileView(generics.RetrieveAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        return Response({
            "id": user.id,
            "username": user.username,
            "email": user.email,
        })

class LoginView(TokenObtainPairView):
    serializer_class = LoginSerializer