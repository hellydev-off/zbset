from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import exception_handler as drf_exception_handler


def custom_exception_handler(exc, context):
    if isinstance(exc, DjangoValidationError):
        if hasattr(exc, "message_dict"):
            detail = exc.message_dict
        else:
            detail = {"detail": exc.messages}
        return Response(detail, status=status.HTTP_400_BAD_REQUEST)

    return drf_exception_handler(exc, context)
