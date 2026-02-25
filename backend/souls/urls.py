from django.urls import path
from django.contrib.auth import views as auth_views
from django.conf import settings
from django.conf.urls.static import static
from . import views

urlpatterns = [
    # Core
    path('', views.home, name='home'),
    path('signup/', views.register, name='signup'),
    path('ajax/validate_user/', views.check_username_email, name='validate_user'),
    
    # Authentication
    path('login/', auth_views.LoginView.as_view(template_name='registration/login.html'), name='login'),
    path('logout/', auth_views.LogoutView.as_view(next_page='login'), name='logout'),

    # Profile Completion (Social Auth)
    path('complete-profile/', views.complete_profile, name='complete_profile'),
    
    # Profile Dashboard
     # Health check endpoint for uptime monitoring
     path('health/', views.health_check, name='health_check'),
    path('dashboard/', views.dashboard, name='dashboard'),
    path('profile/edit/', views.edit_profile, name='edit_profile'),
    path('account/delete/', views.delete_account, name='delete_account'),
    path('profile/delete-resume/', views.delete_resume, name='delete_resume'),

    # Password Reset Flow
    path('password-reset/', auth_views.PasswordResetView.as_view(
          template_name='registration/password_reset.html',email_template_name='registration/password_reset_email.html'), name='password_reset'),

    path('password-reset/done/', 
         auth_views.PasswordResetDoneView.as_view(template_name='registration/password_reset_done.html'), 
         name='password_reset_done'),

    path('password-reset-confirm/<uidb64>/<token>/', 
         auth_views.PasswordResetConfirmView.as_view(template_name='registration/password_reset_confirm.html'), 
         name='password_reset_confirm'),

    path('password-reset-complete/', 
         auth_views.PasswordResetCompleteView.as_view(template_name='registration/password_reset_complete.html'), 
         name='password_reset_complete'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)