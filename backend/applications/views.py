from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.core.files.base import ContentFile

from .models import Application
from .forms import ApplicationForm
from jobs.models import JobPost


@login_required
def apply_to_job(request, job_id):
    """Job seeker applies to a job."""
    job = get_object_or_404(JobPost, pk=job_id)
    
    if request.user.user_type != 'job_seeker':
        messages.error(request, "Only job seekers can apply to jobs.")
        return redirect('job_detail', pk=job_id)
    
    # Check if already applied
    if Application.objects.filter(job=job, applicant=request.user).exists():
        messages.warning(request, "You have already applied to this job.")
        return redirect('job_detail', pk=job_id)
    
    if request.method == 'POST':
        form = ApplicationForm(request.POST, request.FILES, user=request.user)
        if form.is_valid():
            application = form.save(commit=False)
            application.job = job
            application.applicant = request.user
            
            # If no new resume uploaded and user wants to use profile resume
            if not request.FILES.get('resume') and request.POST.get('use_profile_resume'):
                try:
                    profile = request.user.profile
                    if profile.resume:
                        application.resume = profile.resume.name
                except Exception as e:
                    pass
            
            application.save()
            messages.success(request, "Application submitted successfully!")
            return redirect('job_list')
        else:
            messages.error(request, "Please fill in all required fields.")
    else:
        form = ApplicationForm(user=request.user)
    
    return render(request, 'applications/apply.html', {'form': form, 'job': job})


@login_required
def my_applications(request):
    """Job seeker views all their applications."""
    applications = Application.objects.filter(applicant=request.user).order_by('-applied_at')
    return render(request, 'applications/my_applications.html', {'applications': applications})


@login_required
def withdraw_application(request, pk):
    """Job seeker withdraws their application (only if still pending)."""
    application = get_object_or_404(Application, pk=pk, applicant=request.user)
    
    if application.status != 'pending':
        messages.error(request, "You can only withdraw applications that are still pending.")
        return redirect('my_applications')
    
    if request.method == 'POST':
        application.delete()
        messages.success(request, "Application withdrawn successfully!")
        return redirect('my_applications')
    
    return render(request, 'applications/withdraw_confirm.html', {'application': application})


@login_required
def job_applications(request, job_id):
    """Employer views all applications for their job."""
    job = get_object_or_404(JobPost, pk=job_id, posted_by=request.user)
    applications = Application.objects.filter(job=job).order_by('-applied_at')
    return render(request, 'applications/job_applications.html', {'job': job, 'applications': applications})


@login_required
def application_detail(request, pk):
    """View a single application (for employer or applicant)."""
    application = get_object_or_404(Application, pk=pk)
    
    # Only the job owner or applicant can view
    if application.job.posted_by != request.user and application.applicant != request.user:
        messages.error(request, "You don't have permission to view this application.")
        return redirect('dashboard')
    
    return render(request, 'applications/application_detail.html', {'application': application})


@login_required
def update_status(request, pk):
    """Employer updates application status."""
    application = get_object_or_404(Application, pk=pk)
    
    if application.job.posted_by != request.user:
        messages.error(request, "Only the job owner can update application status.")
        return redirect('dashboard')
    
    if request.method == 'POST':
        new_status = request.POST.get('status')
        if new_status in ['pending', 'accepted', 'rejected']:
            application.status = new_status
            application.save()
            messages.success(request, f"Application status updated to {application.get_status_display()}!")
    
    return redirect('application_detail', pk=pk)
