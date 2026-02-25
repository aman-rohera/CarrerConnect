from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.core.paginator import Paginator

from .models import JobPost
from .forms import JobPostForm
from applications.models import Application


def job_list(request):
    """List all jobs with optional search/filter."""
    jobs = JobPost.objects.all().order_by('-posted_at')
    
    # Search by title or location
    query = request.GET.get('q', '')
    if query:
        jobs = jobs.filter(title__icontains=query) | jobs.filter(location__icontains=query)

    # Filter by job type (multiple checkboxes)
    job_types = request.GET.getlist('type')
    if job_types:
        jobs = jobs.filter(job_type__in=job_types)

    # Filter by salary range
    min_salary = request.GET.get('min_salary')
    max_salary = request.GET.get('max_salary')
    if min_salary:
        try:
            jobs = jobs.filter(salary_range__gte=int(min_salary))
        except Exception:
            pass
    if max_salary:
        try:
            jobs = jobs.filter(salary_range__lte=int(max_salary))
        except Exception:
            pass

    paginator = Paginator(jobs, 5)
    page = request.GET.get('page')
    jobs = paginator.get_page(page)

    # Get list of job IDs the user has applied to
    applied_job_ids = []
    if request.user.is_authenticated and request.user.user_type == 'job_seeker':
        applied_job_ids = Application.objects.filter(applicant=request.user).values_list('job_id', flat=True)

    return render(request, 'jobs/job_list.html', {
        'jobs': jobs,
        'query': query,
        'applied_job_ids': list(applied_job_ids),
        'selected_types': job_types,
    })


def job_detail(request, pk):
    """View a single job posting."""
    job = get_object_or_404(JobPost, pk=pk)
    return render(request, 'jobs/job_detail.html', {'job': job})


@login_required
def job_create(request):
    """Employer creates a new job posting."""
    if request.user.user_type != 'employer':
        messages.error(request, "Only employers can post jobs.")
        return redirect('job_list')
    
    if request.method == 'POST':
        form = JobPostForm(request.POST)
        if form.is_valid():
            job = form.save(commit=False)
            job.posted_by = request.user
            job.save()
            messages.success(request, "Job posted successfully!")
            return redirect('job_detail', pk=job.pk)
    else:
        form = JobPostForm()
    
    return render(request, 'jobs/job_form.html', {'form': form, 'action': 'Create'})


@login_required
def job_edit(request, pk):
    """Employer edits their job posting."""
    job = get_object_or_404(JobPost, pk=pk)
    
    if job.posted_by != request.user:
        messages.error(request, "You cannot edit another user's job posting.")
        return redirect('job_list')
    
    if request.method == 'POST':
        form = JobPostForm(request.POST, instance=job)
        if form.is_valid():
            form.save()
            messages.success(request, "Job updated successfully!")
            return redirect('job_detail', pk=job.pk)
    else:
        form = JobPostForm(instance=job)
    
    return render(request, 'jobs/job_form.html', {'form': form, 'action': 'Edit', 'job': job})


@login_required
def job_delete(request, pk):
    """Employer deletes their job posting."""
    job = get_object_or_404(JobPost, pk=pk)
    
    if job.posted_by != request.user:
        messages.error(request, "You cannot delete another user's job posting.")
        return redirect('job_list')
    
    if request.method == 'POST':
        job.delete()
        messages.success(request, "Job deleted successfully!")
        return redirect('my_jobs')
    
    return render(request, 'jobs/job_confirm_delete.html', {'job': job})


@login_required
def my_jobs(request):
    """Employer sees all their posted jobs."""
    if request.user.user_type != 'employer':
        messages.error(request, "Only employers can view their job postings.")
        return redirect('job_list')
    
    jobs = JobPost.objects.filter(posted_by=request.user).order_by('-posted_at')
    return render(request, 'jobs/my_jobs.html', {'jobs': jobs})
