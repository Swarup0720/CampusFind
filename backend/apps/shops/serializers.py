from rest_framework import serializers
from .models import College, Shop

class CollegeSerializer(serializers.ModelSerializer):
    class Meta:
        model = College
        fields = '__all__'

class ShopSerializer(serializers.ModelSerializer):
    owner_username = serializers.ReadOnlyField(source='owner.username')
    college_name = serializers.ReadOnlyField(source='college.name')

    class Meta:
        model = Shop
        fields = (
            'id', 'college', 'college_name', 'name', 'description', 'owner',
            'owner_username', 'phone', 'whatsapp_number', 'location_name',
            'latitude', 'longitude', 'opening_time', 'closing_time',
            'is_open', 'is_active', 'created_at', 'updated_at'
        )

