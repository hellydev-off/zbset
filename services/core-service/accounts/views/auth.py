from rest_framework.views import APIView, Response, Request, status
from ..serializers.auth import UserRegistrationSerializer

class RegisterView(APIView):
    def post(self, request: Request):
        serializer = UserRegistrationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
