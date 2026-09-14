from rest_framework.views import APIView, Request, Response, status

from ..serializers.auth import (
    RefreshTokenSerializer,
    UserLoginSerializer,
    UserRegistrationSerializer,
)
from ..services.jwt_service import JWTService


class RegisterView(APIView):
    def post(self, request: Request):
        user_data = UserRegistrationSerializer(data=request.data)
        user_data.is_valid(raise_exception=True)
        user_data.save()
        return Response(user_data.data, status=status.HTTP_201_CREATED)


class LoginView(APIView):
    def post(self, request: Request):
        user_data = UserLoginSerializer(data=request.data)
        user_data.is_valid(raise_exception=True)
        user = user_data.validated_data["user"]
        jwt_service = JWTService()
        access = jwt_service.create_access_token(str(user.id))
        refresh = jwt_service.create_refresh_token(str(user.id))
        return Response(
            {
                "access_token": access,
                "refresh_token": refresh,
            },
            status=status.HTTP_200_OK,
        )


class RefreshView(APIView):
    def post(self, request: Request):
        user_data = RefreshTokenSerializer(data=request.data)
        jwt_service = JWTService()
        user_data.is_valid(raise_exception=True)
        try:
            payload = jwt_service.decode_refresh_token(
                user_data.validated_data["refresh_token"]
            )
            new_access_token = jwt_service.create_access_token(payload["sub"])
        except ValueError:
            return Response(
                data={"detail": "Invalid refresh token"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return Response({"access_token": new_access_token}, status=status.HTTP_200_OK)
