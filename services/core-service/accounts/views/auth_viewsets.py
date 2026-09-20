from rest_framework import status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.viewsets import ViewSet

from ..serializers.auth import (
    ChangePasswordSerializer,
    RefreshTokenSerializer,
    TokenResponseSerializer,
    UserLoginSerializer,
    UserRegistrationSerializer,
    UserResponseSerializer,
)
from ..services.auth_service import change_password, login, register
from ..services.refresh_token_service import refresh, revoke_token


class AuthViewSet(ViewSet):
    @action(detail=False, methods=["post"])
    def register(self, request: Request) -> Response:
        user_data = UserRegistrationSerializer(data=request.data)
        user_data.is_valid(raise_exception=True)

        user = register(
            user_data.validated_data["email"],
            user_data.validated_data["username"],
            user_data.validated_data["password"],
        )

        return Response(
            UserResponseSerializer(user).data,
            status=status.HTTP_201_CREATED,
        )

    @action(detail=False, methods=["post"])
    def login(self, request: Request) -> Response:
        user_data = UserLoginSerializer(data=request.data)
        user_data.is_valid(raise_exception=True)

        email = user_data.validated_data["email"]
        password = user_data.validated_data["password"]

        tokens = login(email, password)

        return Response(
            tokens,
            status=status.HTTP_200_OK,
        )

    @action(detail=False, methods=["post"])
    def refresh(self, request: Request) -> Response:
        user_data = RefreshTokenSerializer(data=request.data)
        user_data.is_valid(raise_exception=True)

        refresh_token = user_data.validated_data["refresh_token"]

        access_token = refresh(refresh_token)

        tokens = {
            "access_token": access_token,
            "refresh_token": refresh_token,
        }

        return Response(
            TokenResponseSerializer(tokens).data,
            status=status.HTTP_200_OK,
        )

    @action(detail=False, methods=["post"])
    def logout(self, request: Request):
        user_data = RefreshTokenSerializer(data=request.data)
        user_data.is_valid(raise_exception=True)

        revoke_token(user_data.validated_data["refresh_token"])

        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=False, methods=["post"], permission_classes=[IsAuthenticated])
    def change_password(self, request: Request):
        user_data = ChangePasswordSerializer(data=request.data)
        user_data.is_valid(raise_exception=True)

        change_password(
            user=request.user,
            old_password=user_data.validated_data["old_password"],
            new_password=user_data.validated_data["new_password"],
            access_token=request.auth,
        )

        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=False, methods=["get"], permission_classes=[IsAuthenticated])
    def me(self, request: Request):
        return Response(UserResponseSerializer(request.user).data)
