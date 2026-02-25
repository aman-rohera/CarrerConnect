from rest_framework import status, generics
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import logout
from django.conf import settings
from django.core.mail import send_mail
from django.template.loader import render_to_string
import requests
import logging
from urllib.parse import urlencode

logger = logging.getLogger(__name__)

from .models import User, UserProfile
from .serializers import (
    UserSerializer,
    RegisterSerializer,
    LoginSerializer,
    ProfileUpdateSerializer,
    PasswordChangeSerializer,
    UserProfileSerializer,
    ForgotPasswordSerializer,
    ResetPasswordSerializer,
    UsernameValidationSerializer,
)


def send_welcome_email(user):
    """
    Send a welcome email to newly registered users.
    """
    try:
        user_type_display = 'Job Seeker' if user.user_type == 'job_seeker' else 'Employer'
        subject = f'Welcome to CareerConnect, {user.first_name or user.username}!'
        
        # Plain text message
        message = f"""
Hello {user.first_name or user.username},

Welcome to CareerConnect - Your Professional Career Platform!

We're thrilled to have you join our community as a {user_type_display}.

{'As a Job Seeker, you can now:' if user.user_type == 'job_seeker' else 'As an Employer, you can now:'}
{'- Browse thousands of job opportunities' if user.user_type == 'job_seeker' else '- Post job listings to find top talent'}
{'- Apply to positions with just a few clicks' if user.user_type == 'job_seeker' else '- Review applications from qualified candidates'}
{'- Track your application status in real-time' if user.user_type == 'job_seeker' else '- Manage your job postings easily'}
{'- Upload and manage your resume' if user.user_type == 'job_seeker' else '- Connect with the best job seekers'}

Get started by completing your profile to make the most of CareerConnect.

If you have any questions, feel free to reach out to our support team.

Best regards,
The CareerConnect Team

---
This email was sent to {user.email}.
If you did not create an account, please ignore this email.
"""
        
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            fail_silently=False,
        )
        logger.info(f"Welcome email sent to {user.email}")
        return True
    except Exception as e:
        logger.error(f"Failed to send welcome email to {user.email}: {str(e)}")
        return False


@api_view(['POST'])
@permission_classes([AllowAny])
def register_api(request):
    """
    Register a new user (API endpoint).
    """
    serializer = RegisterSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        
        # Send welcome email
        send_welcome_email(user)
        
        return Response({
            'message': 'Account created successfully!',
            'user': UserSerializer(user).data,
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }
        }, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
def login_api(request):
    """
    Login user and return JWT tokens (API endpoint).
    """
    serializer = LoginSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.validated_data['user']
        refresh = RefreshToken.for_user(user)
        return Response({
            'message': 'Welcome back!',
            'user': UserSerializer(user).data,
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }
        }, status=status.HTTP_200_OK)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_api(request):
    """
    Logout user by blacklisting refresh token (API endpoint).
    """
    try:
        refresh_token = request.data.get('refresh')
        if refresh_token:
            token = RefreshToken(refresh_token)
            token.blacklist()
        return Response({'message': 'Logged out successfully.'}, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def me_api(request):
    """
    Get current user details (API endpoint).
    """
    serializer = UserSerializer(request.user)
    return Response(serializer.data)


@api_view(['PUT', 'PATCH'])
@permission_classes([IsAuthenticated])
def update_profile_api(request):
    """
    Update user profile (API endpoint).
    """
    serializer = ProfileUpdateSerializer(request.user, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response({
            'message': 'Profile updated successfully!',
            'user': UserSerializer(request.user).data,
        })
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def change_password_api(request):
    """
    Change user password (API endpoint).
    """
    serializer = PasswordChangeSerializer(data=request.data, context={'request': request})
    if serializer.is_valid():
        serializer.save()
        return Response({'message': 'Password updated successfully!'})
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([AllowAny])
def check_username_api(request):
    """
    Check if username is available (API endpoint).
    """
    username = request.query_params.get('username', '')
    user_id = request.query_params.get('user_id')
    
    if not username:
        return Response({'error': 'Username parameter is required.'}, status=status.HTTP_400_BAD_REQUEST)
    
    query = User.objects.filter(username=username)
    if user_id:
        query = query.exclude(pk=user_id)
    
    if query.exists():
        return Response({'is_available': False, 'message': 'This username is already taken.'})
    return Response({'is_available': True, 'message': 'Username is available!'})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def upload_resume_api(request):
    """
    Upload resume to user profile (API endpoint).
    """
    if 'resume' not in request.FILES:
        return Response({'error': 'No resume file provided.'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        profile = request.user.profile
        profile.resume = request.FILES['resume']
        profile.save()
        return Response({
            'message': 'Resume uploaded successfully!',
            'resume_url': profile.resume.url if profile.resume else None,
        })
    except UserProfile.DoesNotExist:
        return Response({'error': 'Profile not found.'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def upload_profile_picture_api(request):
    """
    Upload profile picture to user profile (API endpoint).
    Uses Cloudinary for storage.
    """
    if 'profile_picture' not in request.FILES:
        return Response({'error': 'No profile picture file provided.'}, status=status.HTTP_400_BAD_REQUEST)
    
    # Validate file type
    file = request.FILES['profile_picture']
    allowed_types = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if file.content_type not in allowed_types:
        return Response({
            'error': 'Invalid file type. Please upload a JPEG, PNG, GIF, or WebP image.'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Validate file size (max 5MB)
    max_size = 5 * 1024 * 1024  # 5MB
    if file.size > max_size:
        return Response({
            'error': 'File too large. Maximum size is 5MB.'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        profile, created = UserProfile.objects.get_or_create(user=request.user)
        
        # Delete old profile picture if exists
        if profile.profile_picture:
            try:
                profile.profile_picture.delete()
            except Exception:
                pass  # Ignore deletion errors
        
        profile.profile_picture = file
        profile.save()
        
        return Response({
            'message': 'Profile picture uploaded successfully!',
            'profile_picture_url': profile.profile_picture.url if profile.profile_picture else None,
        })
    except Exception as e:
        return Response({'error': f'Upload failed: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_profile_picture_api(request):
    """
    Delete profile picture (API endpoint).
    """
    try:
        profile = request.user.profile
        if profile.profile_picture:
            profile.profile_picture.delete()
            profile.profile_picture = None
            profile.save()
            return Response({'message': 'Profile picture deleted successfully.'})
        return Response({'message': 'No profile picture to delete.'})
    except UserProfile.DoesNotExist:
        return Response({'error': 'Profile not found.'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_account_api(request):
    """
    Delete user account (API endpoint).
    """
    user = request.user
    user.delete()
    return Response({'message': 'Account deleted successfully.'}, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([AllowAny])
def forgot_password_api(request):
    """
    Send password reset email (API endpoint).
    """
    serializer = ForgotPasswordSerializer(data=request.data)
    if serializer.is_valid():
        # Get frontend URL from request or use default
        frontend_url = request.data.get('frontend_url', 'http://localhost:5173')
        try:
            serializer.send_reset_email(frontend_url)
        except Exception as e:
            # Log error but don't reveal to user
            print(f"Email send error: {e}")
        
        # Always return success for security (don't reveal if email exists)
        return Response({
            'message': 'If an account with that email exists, we\'ve sent a password reset link. Please check your inbox and spam folder.'
        }, status=status.HTTP_200_OK)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
def reset_password_api(request):
    """
    Reset password with token (API endpoint).
    """
    serializer = ResetPasswordSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response({
            'message': 'Your password has been reset successfully! You can now log in with your new password.'
        }, status=status.HTTP_200_OK)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
def validate_username_api(request):
    """
    Validate username format (API endpoint).
    """
    serializer = UsernameValidationSerializer(data=request.data)
    if serializer.is_valid():
        return Response({'valid': True, 'message': 'Username format is valid.'})
    return Response({'valid': False, 'errors': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([AllowAny])
def check_email_api(request):
    """
    Check if email is available (API endpoint).
    """
    email = request.query_params.get('email', '')
    user_id = request.query_params.get('user_id')
    
    if not email:
        return Response({'error': 'Email parameter is required.'}, status=status.HTTP_400_BAD_REQUEST)
    
    query = User.objects.filter(email=email)
    if user_id:
        query = query.exclude(pk=user_id)
    
    if query.exists():
        return Response({'is_available': False, 'message': 'This email is already registered.'})
    return Response({'is_available': True, 'message': 'Email is available.'})


# ==========================================
# GOOGLE OAUTH API ENDPOINTS
# ==========================================

GOOGLE_OAUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth'
GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token'
GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v2/userinfo'


@api_view(['GET'])
@permission_classes([AllowAny])
def google_auth_url_api(request):
    """
    Get Google OAuth authorization URL.
    Frontend redirects user to this URL to initiate Google Sign-In.
    """
    redirect_uri = request.query_params.get('redirect_uri', 'http://localhost:5173/auth/google/callback')
    
    google_config = settings.SOCIALACCOUNT_PROVIDERS.get('google', {})
    client_id = google_config.get('APP', {}).get('client_id', '')
    
    if not client_id:
        return Response(
            {'error': 'Google OAuth is not configured. Please add GOOGLE_CLIENT_ID to environment variables.'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    
    params = {
        'client_id': client_id,
        'redirect_uri': redirect_uri,
        'response_type': 'code',
        'scope': 'openid email profile',
        'access_type': 'offline',
        'prompt': 'consent',
    }
    
    auth_url = f"{GOOGLE_OAUTH_URL}?{urlencode(params)}"
    
    return Response({
        'auth_url': auth_url,
        'redirect_uri': redirect_uri,
    })


@api_view(['POST'])
@permission_classes([AllowAny])
def google_callback_api(request):
    """
    Handle Google OAuth callback.
    Exchange authorization code for tokens, create/get user, return JWT.
    """
    code = request.data.get('code')
    redirect_uri = request.data.get('redirect_uri', 'http://localhost:5173/auth/google/callback')
    
    if not code:
        return Response({'error': 'Authorization code is required.'}, status=status.HTTP_400_BAD_REQUEST)
    
    google_config = settings.SOCIALACCOUNT_PROVIDERS.get('google', {})
    client_id = google_config.get('APP', {}).get('client_id', '')
    client_secret = google_config.get('APP', {}).get('secret', '')
    
    if not client_id or not client_secret:
        return Response(
            {'error': 'Google OAuth is not configured properly.'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    
    # Exchange code for tokens
    try:
        token_response = requests.post(GOOGLE_TOKEN_URL, data={
            'code': code,
            'client_id': client_id,
            'client_secret': client_secret,
            'redirect_uri': redirect_uri,
            'grant_type': 'authorization_code',
        })
        
        if token_response.status_code != 200:
            return Response(
                {'error': 'Failed to exchange authorization code for tokens.', 'details': token_response.json()},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        tokens = token_response.json()
        access_token = tokens.get('access_token')
        
        # Get user info from Google
        userinfo_response = requests.get(
            GOOGLE_USERINFO_URL,
            headers={'Authorization': f'Bearer {access_token}'}
        )
        
        if userinfo_response.status_code != 200:
            return Response(
                {'error': 'Failed to get user info from Google.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        google_user = userinfo_response.json()
        email = google_user.get('email')
        google_id = google_user.get('id')
        name = google_user.get('name', '')
        picture = google_user.get('picture', '')
        
        if not email:
            return Response(
                {'error': 'Email not provided by Google.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Find or create user
        user = User.objects.filter(email=email).first()
        is_new_user = False
        
        if not user:
            # Create new user
            is_new_user = True
            # Generate username from email or name
            base_username = email.split('@')[0]
            username = base_username
            counter = 1
            while User.objects.filter(username=username).exists():
                username = f"{base_username}{counter}"
                counter += 1
            
            # Split name into first and last
            name_parts = name.split(' ', 1)
            first_name = name_parts[0] if name_parts else ''
            last_name = name_parts[1] if len(name_parts) > 1 else ''
            
            user = User.objects.create(
                username=username,
                email=email,
                first_name=first_name,
                last_name=last_name,
                user_type='job_seeker',  # Default to job seeker
                phone='',  # Will need to complete profile
                location='',  # Will need to complete profile
                profile_complete=False,  # Mark as incomplete for social auth users
            )
            user.set_unusable_password()  # No password for social auth users
            user.save()
            
            # Create user profile
            UserProfile.objects.get_or_create(user=user)
        
        # Generate JWT tokens
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'message': 'Google sign-in successful!' if not is_new_user else 'Account created with Google!',
            'user': UserSerializer(user).data,
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            },
            'is_new_user': is_new_user,
            'profile_complete': user.profile_complete,
        }, status=status.HTTP_200_OK)
        
    except requests.RequestException as e:
        return Response(
            {'error': f'Network error during Google authentication: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    except Exception as e:
        return Response(
            {'error': f'An error occurred: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def complete_google_profile_api(request):
    """
    Complete profile for users who signed up via Google.
    Allows setting user_type, phone, location, etc.
    """
    user = request.user
    
    user_type = request.data.get('user_type')
    phone = request.data.get('phone')
    location = request.data.get('location')
    organization_name = request.data.get('organization_name')
    employer_role = request.data.get('employer_role')
    
    if user_type:
        user.user_type = user_type
    if phone:
        user.phone = phone
    if location:
        user.location = location
    if organization_name:
        user.organization_name = organization_name
    if employer_role:
        user.employer_role = employer_role
    
    # Mark profile as complete if required fields are filled
    # Only send welcome email if this is the first time profile is being completed
    was_incomplete = not user.profile_complete
    if user.user_type and user.phone and user.location:
        user.profile_complete = True
        # Send welcome email only when profile is completed for the first time
        if was_incomplete:
            send_welcome_email(user)
    
    user.save()
    
    return Response({
        'message': 'Profile updated successfully!',
        'user': UserSerializer(user).data,
        'profile_complete': user.profile_complete,
    })


# Admin API endpoints
def is_admin(user):
    """Check if user is an admin."""
    return user.is_authenticated and (user.user_type == 'admin' or user.is_superuser)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_dashboard_stats_api(request):
    """
    Get dashboard statistics for admin (API endpoint).
    """
    if not is_admin(request.user):
        return Response({'error': 'Access denied. Admin privileges required.'}, status=status.HTTP_403_FORBIDDEN)
    
    from jobs.models import JobPost
    from applications.models import Application
    from django.db.models import Count
    from django.utils import timezone
    from datetime import timedelta
    
    # User statistics
    total_users = User.objects.count()
    job_seekers = User.objects.filter(user_type='job_seeker').count()
    employers = User.objects.filter(user_type='employer').count()
    admins = User.objects.filter(user_type='admin').count()
    
    # New users this month
    thirty_days_ago = timezone.now() - timedelta(days=30)
    new_users_this_month = User.objects.filter(date_joined__gte=thirty_days_ago).count()
    
    # Job statistics
    total_jobs = JobPost.objects.count()
    active_jobs = JobPost.objects.filter(application_deadline__gte=timezone.now().date()).count()
    expired_jobs = JobPost.objects.filter(application_deadline__lt=timezone.now().date()).count()
    
    # Application statistics
    total_applications = Application.objects.count()
    pending_applications = Application.objects.filter(status='pending').count()
    reviewed_applications = Application.objects.filter(status='reviewed').count()
    accepted_applications = Application.objects.filter(status='accepted').count()
    rejected_applications = Application.objects.filter(status='rejected').count()
    
    # Recent activity
    recent_users = User.objects.order_by('-date_joined')[:5].values('id', 'username', 'email', 'user_type', 'date_joined')
    recent_jobs = JobPost.objects.order_by('-created_at')[:5].values('id', 'title', 'company_name', 'created_at')
    recent_applications = Application.objects.order_by('-applied_at')[:5].values(
        'id', 'applicant__username', 'job__title', 'status', 'applied_at'
    )
    
    return Response({
        'users': {
            'total': total_users,
            'job_seekers': job_seekers,
            'employers': employers,
            'admins': admins,
            'new_this_month': new_users_this_month,
        },
        'jobs': {
            'total': total_jobs,
            'active': active_jobs,
            'expired': expired_jobs,
        },
        'applications': {
            'total': total_applications,
            'pending': pending_applications,
            'reviewed': reviewed_applications,
            'accepted': accepted_applications,
            'rejected': rejected_applications,
        },
        'recent': {
            'users': list(recent_users),
            'jobs': list(recent_jobs),
            'applications': list(recent_applications),
        }
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_users_list_api(request):
    """
    List all users for admin (API endpoint).
    """
    if not is_admin(request.user):
        return Response({'error': 'Access denied. Admin privileges required.'}, status=status.HTTP_403_FORBIDDEN)
    
    # Optional filters
    user_type = request.query_params.get('user_type')
    search = request.query_params.get('search')
    
    users = User.objects.all().order_by('-date_joined')
    
    if user_type:
        users = users.filter(user_type=user_type)
    
    if search:
        from django.db.models import Q
        users = users.filter(
            Q(username__icontains=search) |
            Q(email__icontains=search)
        )
    
    users_data = []
    for user in users:
        users_data.append({
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'user_type': user.user_type,
            'phone': user.phone,
            'location': user.location,
            'organization_name': user.organization_name,
            'is_active': user.is_active,
            'date_joined': user.date_joined,
            'last_login': user.last_login,
        })
    
    return Response({'users': users_data})


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def admin_user_update_api(request, user_id):
    """
    Update a user as admin (API endpoint).
    """
    if not is_admin(request.user):
        return Response({'error': 'Access denied. Admin privileges required.'}, status=status.HTTP_403_FORBIDDEN)
    
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)
    
    # Update allowed fields
    if 'user_type' in request.data:
        user.user_type = request.data['user_type']
    if 'is_active' in request.data:
        user.is_active = request.data['is_active']
    if 'username' in request.data:
        user.username = request.data['username']
    if 'email' in request.data:
        user.email = request.data['email']
    
    user.save()
    
    return Response({
        'message': 'User updated successfully!',
        'user': {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'user_type': user.user_type,
            'is_active': user.is_active,
        }
    })


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def admin_user_delete_api(request, user_id):
    """
    Delete a user as admin (API endpoint).
    """
    if not is_admin(request.user):
        return Response({'error': 'Access denied. Admin privileges required.'}, status=status.HTTP_403_FORBIDDEN)
    
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)
    
    # Prevent admin from deleting themselves
    if user.id == request.user.id:
        return Response({'error': 'You cannot delete your own account from admin panel.'}, status=status.HTTP_400_BAD_REQUEST)
    
    user.delete()
    
    return Response({'message': 'User deleted successfully!'})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_jobs_list_api(request):
    """
    List all jobs for admin (API endpoint).
    """
    if not is_admin(request.user):
        return Response({'error': 'Access denied. Admin privileges required.'}, status=status.HTTP_403_FORBIDDEN)
    
    from jobs.models import JobPost
    
    # Optional filters
    search = request.query_params.get('search')
    
    jobs = JobPost.objects.all().order_by('-created_at')
    
    if search:
        from django.db.models import Q
        jobs = jobs.filter(
            Q(title__icontains=search) |
            Q(company_name__icontains=search)
        )
    
    jobs_data = []
    for job in jobs:
        jobs_data.append({
            'id': job.id,
            'title': job.title,
            'company_name': job.company_name,
            'location': job.location,
            'job_type': job.job_type,
            'salary_min': job.salary_min,
            'salary_max': job.salary_max,
            'application_deadline': job.application_deadline,
            'created_at': job.created_at,
            'employer_id': job.employer_id,
            'employer_name': job.employer.username if job.employer else None,
        })
    
    return Response({'jobs': jobs_data})


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def admin_job_delete_api(request, job_id):
    """
    Delete a job as admin (API endpoint).
    """
    if not is_admin(request.user):
        return Response({'error': 'Access denied. Admin privileges required.'}, status=status.HTTP_403_FORBIDDEN)
    
    from jobs.models import JobPost
    
    try:
        job = JobPost.objects.get(id=job_id)
    except JobPost.DoesNotExist:
        return Response({'error': 'Job not found.'}, status=status.HTTP_404_NOT_FOUND)
    
    job.delete()
    
    return Response({'message': 'Job deleted successfully!'})

