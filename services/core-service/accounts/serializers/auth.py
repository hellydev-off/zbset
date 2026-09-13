from rest_framework import serializers
from ..models.user import User

class UserRegistrationSerializer(serializers.Serializer):
    email = serializers.EmailField()
    username = serializers.CharField(max_length=50, min_length=5)
    password = serializers.CharField(write_only=True, min_length=8)

    def validate_email(self, value):
        norm_email = value.strip().lower()
        if User.objects.filter(email=norm_email).exists():
            raise serializers.ValidationError("Email already taken")
        return norm_email

    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("Username already taken")
        return value

    def create(self, validated_data):
        return User.objects.create_user(**validated_data)