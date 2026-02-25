from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import api_views

urlpatterns = [
    # Authentication
    path('register/', api_views.register_api, name='api_register'),
    path('login/', api_views.login_api, name='api_login'),
    path('logout/', api_views.logout_api, name='api_logout'),
    path('token/refresh/', TokenRefreshView.as_view(), name='api_token_refresh'),
    
    # Google OAuth
    path('google/url/', api_views.google_auth_url_api, name='api_google_auth_url'),
    path('google/callback/', api_views.google_callback_api, name='api_google_callback'),
    path('google/complete-profile/', api_views.complete_google_profile_api, name='api_google_complete_profile'),
    
    # Password Reset
    path('password/forgot/', api_views.forgot_password_api, name='api_forgot_password'),
    path('password/reset/', api_views.reset_password_api, name='api_reset_password'),
    
    # User profile
    path('me/', api_views.me_api, name='api_me'),
    path('profile/', api_views.update_profile_api, name='api_profile_update'),
    path('password/change/', api_views.change_password_api, name='api_password_change'),
    path('check-username/', api_views.check_username_api, name='api_check_username'),
    path('check-email/', api_views.check_email_api, name='api_check_email'),
    path('validate-username/', api_views.validate_username_api, name='api_validate_username'),
    path('upload-resume/', api_views.upload_resume_api, name='api_upload_resume'),
    path('upload-profile-picture/', api_views.upload_profile_picture_api, name='api_upload_profile_picture'),
    path('delete-profile-picture/', api_views.delete_profile_picture_api, name='api_delete_profile_picture'),
    path('delete-account/', api_views.delete_account_api, name='api_delete_account'),
    
    # Admin endpoints
    path('admin/dashboard/', api_views.admin_dashboard_stats_api, name='api_admin_dashboard'),
    path('admin/users/', api_views.admin_users_list_api, name='api_admin_users'),
    path('admin/users/<int:user_id>/', api_views.admin_user_update_api, name='api_admin_user_update'),
    path('admin/users/<int:user_id>/delete/', api_views.admin_user_delete_api, name='api_admin_user_delete'),
    path('admin/jobs/', api_views.admin_jobs_list_api, name='api_admin_jobs'),
    path('admin/jobs/<int:job_id>/delete/', api_views.admin_job_delete_api, name='api_admin_job_delete'),
]
