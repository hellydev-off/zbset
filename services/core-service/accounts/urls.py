from django.urls import include, path
from rest_framework.routers import SimpleRouter

from .views.auth_viewsets import AuthViewSet

router = SimpleRouter()
router.register(
    r"auth",
    AuthViewSet,
    basename="auth",
)

urlpatterns = [
    path("", include(router.urls)),
    path("me/", AuthViewSet.as_view({"get": "me"}), name="me"),
]
