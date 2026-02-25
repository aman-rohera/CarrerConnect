from django.db import models
from django.conf import settings
from jobs.models import JobPost

APPLICATION_STATUS_CHOICES = (
    ('pending', 'Pending Review'),
    ('accepted', 'Accepted'),
    ('rejected', 'Rejected'),
)


class Application(models.Model):
    """Job application model."""
    
    # The Job being applied for
    job = models.ForeignKey(
        JobPost, 
        on_delete=models.CASCADE, 
        related_name='applications'
    )
    
    # The Job Seeker
    applicant = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name='applications'
    )
    
    # Cover letter content
    cover_letter = models.TextField(
        verbose_name="Cover Letter", 
        help_text="Tell us why you're the perfect fit"
    )
    
    # Resume for this application
    resume = models.FileField(
        upload_to='application_resumes/',
        blank=True,
        null=True,
        verbose_name="Resume"
    )
    
    status = models.CharField(
        max_length=20, 
        choices=APPLICATION_STATUS_CHOICES, 
        default='pending',
        verbose_name="Status"
    )
    
    applied_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        # Prevent applying to the same job twice
        unique_together = ('job', 'applicant')

    def __str__(self):
        return f"{self.applicant} -> {self.job}"