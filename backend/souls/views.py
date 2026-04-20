from django.shortcuts import render, redirect
from django.contrib.auth import login, logout
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.http import JsonResponse
from django.db import DatabaseError
def health_check(request):
    """Health check endpoint for uptime monitoring.

    Also performs a lightweight DB read so external pings keep the
    Supabase/PostgreSQL connection warm.
    """
    db_status = "ok"

    try:
        # Fetch a single id to trigger a real read query with minimal load.
        User.objects.values_list('id', flat=True).first()
    except DatabaseError:
        db_status = "error"

    return JsonResponse({"status": "ok", "database": db_status})

from .models import UserProfile, User
from .forms import (
    UserProfileForm,
    RegistrationForm,
    UserUpdateForm,
    ProfileCompletionForm
)


def home(request):
    """Home page view."""
    context = {
        'greeting': 'Welcome to the Job Recruitment Platform',
        'messages': [
            'Find your next opportunity',
            'Connect with top employers',
            'Build your career today'
        ]
    }
    return render(request, 'souls/home.html', context)


def register(request):
    """User registration view."""
    if request.method == 'POST':
        form = RegistrationForm(request.POST)
        if form.is_valid():
            user = form.save(commit=False)
            user.profile_complete = True
            user.save()

            UserProfile.objects.create(user=user)

            login(request, user, backend='django.contrib.auth.backends.ModelBackend')
            messages.success(request, "Registration successful!")
            return redirect('dashboard')
    else:
        form = RegistrationForm()

    return render(request, 'registration/signup.html', {'form': form})


@login_required
def complete_profile(request):
    """Complete profile after social auth sign-in."""
    if request.user.profile_complete:
        return redirect('dashboard')
    
    if request.method == 'POST':
        form = ProfileCompletionForm(request.POST, instance=request.user)
        if form.is_valid():
            user = form.save(commit=False)
            user.profile_complete = True
            user.save()
            
            UserProfile.objects.get_or_create(user=user)
            
            messages.success(request, "Profile completed successfully! Welcome.")
            return redirect('dashboard')
    else:
        form = ProfileCompletionForm(instance=request.user)
    
    return render(request, 'registration/complete_profile.html', {'form': form})


def check_username_available(request):
    """AJAX endpoint to check if username is available."""
    username = request.GET.get('username', '')
    user_id = request.GET.get('user_id', None)
    
    if username:
        query = User.objects.filter(username=username)
        if user_id:
            query = query.exclude(pk=user_id)
        
        if query.exists():
            return JsonResponse({'is_taken': True, 'error_message': 'This username is already taken.'})
        return JsonResponse({'is_taken': False})
    
    return JsonResponse({'is_taken': False})


@login_required
def dashboard(request):
    """User dashboard view."""
    if not request.user.profile_complete:
        return redirect('complete_profile')
    
    profile, _ = UserProfile.objects.get_or_create(user=request.user)

    context = {
        'profile': profile,
        'user': request.user,
    }
    return render(request, 'souls/dashboard.html', context)


@login_required
def edit_profile(request):
    """Edit user profile view."""
    profile, _ = UserProfile.objects.get_or_create(user=request.user)

    if request.method == 'POST':
        u_form = UserUpdateForm(request.POST, instance=request.user)
        
        if profile.resume and 'resume' in request.FILES:
            messages.error(request, "You must delete the existing resume before uploading a new one.")
            return redirect('edit_profile')
        
        p_form = UserProfileForm(
            request.POST,
            request.FILES,
            instance=profile
        )

        if u_form.is_valid() and p_form.is_valid():
            u_form.save()
            p_form.save()
            messages.success(request, "Profile updated successfully.")
            return redirect('dashboard')
    else:
        u_form = UserUpdateForm(instance=request.user)
        p_form = UserProfileForm(instance=profile)

    context = {
        'u_form': u_form,
        'p_form': p_form,
        'profile': profile
    }
    return render(request, 'souls/edit_profile.html', context)


@login_required
def delete_account(request):
    """Delete user account."""
    if request.method == 'POST':
        user = request.user
        logout(request)
        user.delete()
        messages.success(request, "Your account has been deleted.")
        return redirect('home')

    return render(request, 'souls/confirm_delete.html')


def check_username_email(request):
    """AJAX check for username/email availability."""
    username = request.GET.get('username')
    email = request.GET.get('email')

    data = {
        'is_taken': False,
        'error_message': ''
    }

    if username and User.objects.filter(username__iexact=username).exists():
        data['is_taken'] = True
        data['error_message'] = 'This username is already taken.'

    if email and User.objects.filter(email__iexact=email).exists():
        data['is_taken'] = True
        data['error_message'] = 'An account with this email already exists.'

    return JsonResponse(data)


@login_required
def delete_resume(request):
    """Delete user resume."""
    profile = request.user.profile

    if profile.resume:
        profile.resume.delete(save=False)
        profile.resume = None
        profile.save()
        messages.success(request, "Resume deleted successfully.")

    return redirect('edit_profile')
