from django.db import models
from django.conf import settings

JOB_TYPE_CHOICES = (
    ('full_time', 'Full Time'),
    ('part_time', 'Part Time'),
    ('contract', 'Contract'),
)


class JobPost(models.Model):
    """Job posting model."""
    
    # Link to the employer
    posted_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name='posted_jobs',
        limit_choices_to={'user_type': 'employer'},
        verbose_name="Posted By"
    )
    
    title = models.CharField(max_length=200, help_text="Job Title")
    description = models.TextField(verbose_name="Job Description")
    location = models.CharField(max_length=100, verbose_name="Location")
    
    salary_range = models.CharField(
        max_length=100, 
        verbose_name="Salary Range", 
        help_text="e.g. $80,000 - $120,000 / Year"
    )
    
    job_type = models.CharField(
        max_length=20, 
        choices=JOB_TYPE_CHOICES, 
        default='full_time',
        verbose_name="Employment Type"
    )
    
    posted_at = models.DateTimeField(auto_now_add=True, verbose_name="Posted Date")

    def __str__(self):
        return self.title