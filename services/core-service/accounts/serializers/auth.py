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


class UserLoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=8)

    def validate(self, attrs):
        email = attrs["email"]
        password = attrs["password"]
        try:
            user: User = User.objects.get(email=email)
        except User.DoesNotExist:
            raise serializers.ValidationError("Invalid email or password")

        if not user.check_password(password):
            raise serializers.ValidationError("Invalid email or password")

        if not user.is_active:
            raise serializers.ValidationError("User is inactive")
        attrs["user"] = user
        return attrs


class RefreshTokenSerializer(serializers.Serializer):
    refresh_token = serializers.CharField(write_only=True)

    def validate_refresh_token(self, value):
        if not value:
            raise serializers.ValidationError("Invalid token")
        return value
