from django.contrib.auth import get_user_model
from djoser.serializers import (
    UserCreateSerializer as BaseUserCreateSerializer,
    UserSerializer as BaseUserSerializer,
)


class UserCreateSerializer(BaseUserCreateSerializer):
    class Meta(BaseUserCreateSerializer.Meta):
        fields = [
            'id',
            'email',
            'password',
            'first_name',
            'last_name',
            'address',
            'phone_number',
        ]


class Userserializer(BaseUserSerializer):
    class Meta(BaseUserSerializer.Meta):
        ref_name = 'CustomUser'
        model = get_user_model()
        fields = [
            'id',
            'email',
            'first_name',
            'last_name',
            'address',
            'phone_number',
            'is_staff',
            'is_superuser',
            'date_joined',
        ]
        read_only_fields = ['id', 'email', 'is_staff', 'is_superuser', 'date_joined']
