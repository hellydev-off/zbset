from django.urls import path
from .views.auth import RegisterView

urlpatterns = [
    path("register/", RegisterView.as_view()),
]
