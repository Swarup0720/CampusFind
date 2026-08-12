import re
from rest_framework import serializers
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from apps.shops.models import College

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    shop_id = serializers.SerializerMethodField()
    display_name = serializers.SerializerMethodField()
    college_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = (
            'id', 'username', 'full_name', 'display_name', 'email', 'phone', 
            'role', 'college', 'college_name', 'shop_id', 'is_active', 
            'created_at', 'last_login'
        )
        read_only_fields = ('id', 'created_at', 'last_login', 'shop_id')

    def get_shop_id(self, obj):
        try:
            return obj.shop.id if obj.shop else None
        except Exception:
            return None

    def get_display_name(self, obj):
        return obj.display_name

    def get_college_name(self, obj):
        return obj.college.name if obj.college else 'ITER College (SOA University)'

class RegisterSerializer(serializers.Serializer):
    full_name = serializers.CharField(max_length=255)
    email = serializers.EmailField()
    phone = serializers.CharField(max_length=20)
    password = serializers.CharField(write_only=True, min_length=6)

    def validate_full_name(self, value):
        name_clean = value.strip()
        if not name_clean:
            raise serializers.ValidationError("Full name cannot be empty.")
        return name_clean

    def validate_email(self, value):
        email_clean = value.lower().strip()
        if User.objects.filter(email__iexact=email_clean).exists():
            raise serializers.ValidationError("An account with this email already exists. Please sign in.")
        return email_clean

    def validate_phone(self, value):
        # Normalize phone to 10 digits
        raw_digits = re.sub(r'\D', '', value)
        if len(raw_digits) == 12 and raw_digits.startswith('91'):
            raw_digits = raw_digits[2:]
        
        if len(raw_digits) != 10:
            raise serializers.ValidationError("Please enter a valid 10-digit Indian phone number.")

        if User.objects.filter(phone=raw_digits).exists():
            raise serializers.ValidationError("An account with this phone number already exists.")

        return raw_digits

    def create(self, validated_data):
        email = validated_data['email']
        username = email.split('@')[0] + '_' + validated_data['phone'][-4:]
        
        # Ensure username uniqueness
        base_uname = username
        counter = 1
        while User.objects.filter(username=username).exists():
            username = f"{base_uname}_{counter}"
            counter += 1

        iter_college = College.objects.filter(name__icontains='ITER').first()
        if not iter_college:
            iter_college, _ = College.objects.get_or_create(
                name="ITER College (SOA University)",
                defaults={'address': 'Bhubaneswar, Odisha', 'is_active': True}
            )

        user = User.objects.create_user(
            username=username,
            email=email,
            password=validated_data['password']
        )
        user.full_name = validated_data['full_name']
        user.phone = validated_data['phone']
        user.role = User.Role.STUDENT
        user.college = iter_college
        user.save()
        return user

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['username'] = user.username
        token['email'] = user.email
        token['role'] = user.role
        try:
            if hasattr(user, 'shop') and user.shop:
                token['shop_id'] = user.shop.id
        except Exception:
            pass
        return token

    def validate(self, attrs):
        # Allow login with email or phone number — resolve to actual username
        identifier = attrs.get('username', '').strip()
        if identifier and identifier != '':
            resolved_user = None
            # Check if it's an email (contains @)
            if '@' in identifier:
                resolved_user = User.objects.filter(email__iexact=identifier).first()
            else:
                # Strip non-digits and try phone lookup
                digits_only = ''.join(filter(str.isdigit, identifier))
                if len(digits_only) >= 10:
                    phone_10 = digits_only[-10:]  # last 10 digits
                    resolved_user = User.objects.filter(phone=phone_10).first()

            if resolved_user:
                attrs['username'] = resolved_user.username

        data = super().validate(attrs)
        data['user'] = UserSerializer(self.user).data
        return data
