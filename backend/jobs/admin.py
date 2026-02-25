from django.contrib import admin
from .models import JobPost


@admin.register(JobPost)
class JobPostAdmin(admin.ModelAdmin):
    list_display = ('title', 'posted_by', 'job_type', 'salary_range', 'posted_at')
    list_filter = ('job_type', 'posted_at')
    search_fields = ('title', 'description', 'posted_by__username')