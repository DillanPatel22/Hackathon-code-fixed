from django.urls import path
from .views import RegisterView, ProfileView, LoginView

urlpatterns = [
    path("register/", RegisterView.as_view()),
    path("login/", LoginView.as_view()),
    path("me/", ProfileView.as_view()),
]
