import os
import re
import requests
from rest_framework import serializers
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.core.mail import send_mail
from django.conf import settings
from .models import User, UserProfile


class UserProfileSerializer(serializers.ModelSerializer):
    """Serializer for UserProfile model."""
    profile_picture_url = serializers.SerializerMethodField()
    
    class Meta:
        model = UserProfile
        fields = [
            'id',
            'profile_picture',
            'profile_picture_url',
            'resume',
            'skills',
            'portfolio_url',
            'company_website',
            'company_description',
        ]
        extra_kwargs = {
            'profile_picture': {'write_only': True}
        }
    
    def get_profile_picture_url(self, obj):
        if obj.profile_picture:
            return obj.profile_picture.url
        return None


class UserSerializer(serializers.ModelSerializer):
    """Serializer for User model with profile."""
    profile = UserProfileSerializer(read_only=True)
    
    class Meta:
        model = User
        fields = [
            'id',
            'username',
            'email',
            'user_type',
            'phone',
            'location',
            'employer_role',
            'organization_name',
            'profile_complete',
            'profile',
        ]
        read_only_fields = ['id', 'email', 'profile_complete']


class RegisterSerializer(serializers.ModelSerializer):
    """Serializer for user registration."""
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True)
    
    class Meta:
        model = User
        fields = [
            'username',
            'email',
            'password',
            'password2',
            'user_type',
            'phone',
            'location',
            'employer_role',
            'organization_name',
        ]
    
    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Passwords don't match."})
        return attrs
    
    def create(self, validated_data):
        validated_data.pop('password2')
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            user_type=validated_data.get('user_type', 'job_seeker'),
            phone=validated_data.get('phone', ''),
            location=validated_data.get('location', ''),
            employer_role=validated_data.get('employer_role'),
            organization_name=validated_data.get('organization_name'),
            profile_complete=True,
        )
        # Create UserProfile for the user
        UserProfile.objects.create(user=user)
        return user


class LoginSerializer(serializers.Serializer):
    """Serializer for user login."""
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
    
    def validate(self, attrs):
        email = attrs.get('email')
        password = attrs.get('password')
        
        # Get user by email
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            raise serializers.ValidationError("Invalid credentials.")
        
        # Authenticate using username (Django default)
        user = authenticate(username=user.username, password=password)
        
        if not user:
            raise serializers.ValidationError("Invalid credentials.")
        
        if not user.is_active:
            raise serializers.ValidationError("User account is disabled.")
        
        attrs['user'] = user
        return attrs


class ProfileUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating user profile."""
    profile = UserProfileSerializer()
    
    class Meta:
        model = User
        fields = [
            'username',
            'phone',
            'location',
            'employer_role',
            'organization_name',
            'profile',
        ]
    
    def update(self, instance, validated_data):
        profile_data = validated_data.pop('profile', {})
        
        # Update user fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # Update profile fields
        if profile_data and hasattr(instance, 'profile'):
            profile = instance.profile
            for attr, value in profile_data.items():
                setattr(profile, attr, value)
            profile.save()
        
        return instance


class PasswordChangeSerializer(serializers.Serializer):
    """Serializer for password change."""
    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, validators=[validate_password])
    
    def validate_old_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError("Old password is incorrect.")
        return value
    
    def save(self):
        user = self.context['request'].user
        user.set_password(self.validated_data['new_password'])
        user.save()
        return user


class ForgotPasswordSerializer(serializers.Serializer):
    """Serializer for password reset request."""
    email = serializers.EmailField()

    def validate_email(self, value):
        try:
            user = User.objects.get(email=value)
            self.user = user
        except User.DoesNotExist:
            # For security, don't reveal if email exists
            pass
        return value

    def _send_via_resend(self, subject, message, html_message, to_email):
        api_key = os.getenv('RESEND_API_KEY')
        from_email = os.getenv('RESEND_FROM_EMAIL', settings.DEFAULT_FROM_EMAIL)

        if not api_key:
            return False

        try:
            response = requests.post(
                'https://api.resend.com/emails',
                headers={
                    'Authorization': f'Bearer {api_key}',
                    'Content-Type': 'application/json',
                },
                json={
                    'from': from_email,
                    'to': [to_email],
                    'subject': subject,
                    'html': html_message,
                    'text': message,
                },
                timeout=10,
            )
            response.raise_for_status()
            return True
        except Exception as e:
            try:
                detail = response.text if 'response' in locals() else ''
            except Exception:
                detail = ''
            print(f"Resend send error: {e} {detail}")
            return False

    def _send_via_sendgrid(self, subject, message, html_message, to_email):
        api_key = os.getenv('SENDGRID_API_KEY')
        from_email = os.getenv('SENDGRID_FROM_EMAIL') or settings.DEFAULT_FROM_EMAIL
        from_name = os.getenv('SENDGRID_FROM_NAME', 'CareerConnect')

        if not api_key or not from_email:
            return False

        payload = {
            "personalizations": [
                {
                    "to": [{"email": to_email}]
                }
            ],
            "from": {"email": from_email, "name": from_name},
            "subject": subject,
            "content": [
                {"type": "text/plain", "value": message},
                {"type": "text/html", "value": html_message},
            ],
        }

        try:
            response = requests.post(
                'https://api.sendgrid.com/v3/mail/send',
                headers={
                    'Authorization': f'Bearer {api_key}',
                    'Content-Type': 'application/json',
                },
                json=payload,
                timeout=10,
            )
            response.raise_for_status()
            return True
        except Exception as e:
            try:
                detail = response.text if 'response' in locals() else ''
            except Exception:
                detail = ''
            print(f"SendGrid send error: {e} {detail}")
            return False

    def _send_via_brevo(self, subject, message, html_message, to_email):
        api_key = os.getenv('BREVO_API_KEY')
        from_email = os.getenv('BREVO_FROM_EMAIL') or settings.DEFAULT_FROM_EMAIL
        from_name = os.getenv('BREVO_FROM_NAME', 'CareerConnect')

        if not api_key or not from_email:
            return False

        payload = {
            "sender": {"email": from_email, "name": from_name},
            "to": [{"email": to_email}],
            "subject": subject,
            "textContent": message,
            "htmlContent": html_message,
        }

        try:
            response = requests.post(
                'https://api.brevo.com/v3/smtp/email',
                headers={
                    'api-key': api_key,
                    'accept': 'application/json',
                    'content-type': 'application/json',
                },
                json=payload,
                timeout=10,
            )
            response.raise_for_status()
            return True
        except Exception as e:
            try:
                detail = response.text if 'response' in locals() else ''
            except Exception:
                detail = ''
            print(f"Brevo send error: {e} {detail}")
            return False

    def send_reset_email(self, frontend_url):
        if not hasattr(self, 'user'):
            return  # Silently fail if user not found (security)
        
        user = self.user
        token = default_token_generator.make_token(user)
        uid = urlsafe_base64_encode(force_bytes(user.pk))
        
        reset_link = f"{frontend_url}/reset-password/{uid}/{token}"
        
        subject = "Reset Your Password - CareerConnect"
        message = f"""
Dear {user.username},

We received a request to reset your password for your CareerConnect account.

To reset your password, please click on the link below:

{reset_link}

This link will expire in 24 hours for security reasons.

If you did not request a password reset, please ignore this email. Your password will remain unchanged.

Need help? Contact our support team at support@careerconnect.com

Best regards,
The CareerConnect Team

---
This is an automated message. Please do not reply directly to this email.
        """
        
        html_message = f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: 'Inter', Arial, sans-serif; line-height: 1.6; color: #191919; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #0077b5 0%, #0a66c2 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 28px;">CareerConnect</h1>
        <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0;">Your Career Journey Starts Here</p>
    </div>
    
    <div style="background: #ffffff; padding: 40px 30px; border: 1px solid #e0e0e0; border-top: none;">
        <h2 style="color: #191919; margin-top: 0;">Password Reset Request</h2>
        
        <p>Dear <strong>{user.username}</strong>,</p>
        
        <p>We received a request to reset your password for your CareerConnect account. No worries – it happens to the best of us!</p>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="{reset_link}" style="background-color: #0a66c2; color: white; padding: 14px 32px; text-decoration: none; border-radius: 24px; font-weight: 600; display: inline-block;">Reset My Password</a>
        </div>
        
        <p style="color: #666666; font-size: 14px;">Or copy and paste this link into your browser:</p>
        <p style="background: #f3f2ef; padding: 12px; border-radius: 8px; word-break: break-all; font-size: 13px; color: #0a66c2;">{reset_link}</p>
        
        <div style="background: #fff3cd; border: 1px solid #ffeeba; border-radius: 8px; padding: 16px; margin: 24px 0;">
            <p style="margin: 0; color: #856404; font-size: 14px;">
                <strong>Important:</strong> This link will expire in 24 hours for security reasons.
            </p>
        </div>
        
        <p style="color: #666666;">If you did not request a password reset, please ignore this email. Your password will remain unchanged and your account is secure.</p>
    </div>
    
    <div style="background: #f3f2ef; padding: 24px 30px; border-radius: 0 0 12px 12px; text-align: center; border: 1px solid #e0e0e0; border-top: none;">
        <p style="color: #666666; margin: 0 0 8px 0; font-size: 14px;">Need help? Contact us at <a href="mailto:support@careerconnect.com" style="color: #0a66c2;">support@careerconnect.com</a></p>
        <p style="color: #999999; font-size: 12px; margin: 0;">© 2026 CareerConnect. All rights reserved.</p>
    </div>
</body>
</html>
        """
        
        # Preferred: Brevo HTTPS API (works without SMTP)
        if self._send_via_brevo(subject, message, html_message, user.email):
            return

        # Fallbacks: SendGrid then Resend
        if self._send_via_sendgrid(subject, message, html_message, user.email):
            return

        # If SendGrid not configured, try Resend (requires verified domain or test sender)
        if os.getenv('RESEND_API_KEY'):
            self._send_via_resend(subject, message, html_message, user.email)
            return

        # Final fallback: SMTP (may be blocked on host)
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            html_message=html_message,
            fail_silently=False,
        )


class ResetPasswordSerializer(serializers.Serializer):
    """Serializer for password reset confirmation."""
    uid = serializers.CharField()
    token = serializers.CharField()
    new_password = serializers.CharField(write_only=True, validators=[validate_password])
    confirm_password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        if attrs['new_password'] != attrs['confirm_password']:
            raise serializers.ValidationError({"confirm_password": "Passwords don't match."})
        
        try:
            uid = force_str(urlsafe_base64_decode(attrs['uid']))
            user = User.objects.get(pk=uid)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            raise serializers.ValidationError({"uid": "Invalid reset link."})
        
        if not default_token_generator.check_token(user, attrs['token']):
            raise serializers.ValidationError({"token": "Reset link has expired or is invalid."})
        
        self.user = user
        return attrs

    def save(self):
        self.user.set_password(self.validated_data['new_password'])
        self.user.save()
        return self.user


class UsernameValidationSerializer(serializers.Serializer):
    """Serializer for username validation."""
    username = serializers.CharField(min_length=3, max_length=30)

    def validate_username(self, value):
        # Check if username contains only valid characters
        if not re.match(r'^[a-zA-Z0-9_]+$', value):
            raise serializers.ValidationError(
                "Username can only contain letters, numbers, and underscores."
            )
        
        # Check for reserved usernames
        reserved = ['admin', 'administrator', 'support', 'helpdesk', 'root', 'system']
        if value.lower() in reserved:
            raise serializers.ValidationError("This username is reserved.")
        
        return value
