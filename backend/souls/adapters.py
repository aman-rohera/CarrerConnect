from allauth.socialaccount.adapter import DefaultSocialAccountAdapter
from allauth.account.adapter import DefaultAccountAdapter
from django.shortcuts import redirect


class CustomSocialAccountAdapter(DefaultSocialAccountAdapter):
    """
    Custom adapter for social authentication.
    Redirects new users to complete their profile after social sign-in.
    """
    
    def save_user(self, request, sociallogin, form=None):
        """
        Called when a new user signs up via social auth.
        We mark profile_complete as False so they complete their profile.
        """
        user = super().save_user(request, sociallogin, form)
        user.profile_complete = False
        user.save()
        return user

    def get_login_redirect_url(self, request):
        """
        After social login, check if profile is complete.
        If not, redirect to profile completion page.
        """
        user = request.user
        if user.is_authenticated and not user.profile_complete:
            return '/complete-profile/'
        return '/'


class CustomAccountAdapter(DefaultAccountAdapter):
    """
    Custom adapter for regular account operations.
    """
    
    def get_login_redirect_url(self, request):
        """
        After login, check if profile is complete (for social auth users).
        """
        user = request.user
        if user.is_authenticated and not user.profile_complete:
            return '/complete-profile/'
        return '/dashboard/'
