from django.db import connection
from django.http import JsonResponse

def health_check(request):
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
    except:
        return JsonResponse({"status": "error", "service": "core-service", "db": "unavailable"})
    return JsonResponse({"status": "ok", "service": "core-service"})