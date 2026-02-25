from django.db import models
from django.contrib.auth.models import AbstractUser
from cloudinary.models import CloudinaryField


class User(AbstractUser):
    """Custom User model for authentication and core identity."""
    
    USER_TYPE_CHOICES = (
        ('job_seeker', 'Job Seeker'),
        ('employer', 'Employer'),
        ('admin', 'Administrator'),
    )
    
    EMPLOYER_TYPE_CHOICES = (
        ('hr', 'HR Representative'),
        ('company', 'Direct Company'),
    )

    # User Role
    user_type = models.CharField(
        max_length=20, 
        choices=USER_TYPE_CHOICES, 
        default='job_seeker',
        verbose_name="User Role"
    )

    # Universal Fields
    phone = models.CharField(max_length=15, verbose_name="Phone Number", blank=True)
    location = models.CharField(max_length=100, verbose_name="Location", blank=True)

    # Employer Specific Fields
    employer_role = models.CharField(
        max_length=20, 
        choices=EMPLOYER_TYPE_CHOICES, 
        blank=True, 
        null=True,
        verbose_name="Employer Type"
    )
    organization_name = models.CharField(
        max_length=100, 
        blank=True, 
        null=True, 
        verbose_name="Organization Name"
    )
    
    # Track if social auth users have completed their profile
    profile_complete = models.BooleanField(default=False)

    def is_employer(self):
        return self.user_type == 'employer'
    
    def is_admin(self):
        return self.user_type == 'admin' or self.is_superuser


class UserProfile(models.Model):
    """Extended profile information for users."""
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    
    # Profile Picture (Cloudinary)
    profile_picture = CloudinaryField(
        'profile_picture',
        folder='profile_pictures',
        blank=True,
        null=True,
        resource_type='image',
        transformation={'width': 400, 'height': 400, 'crop': 'fill', 'gravity': 'face'}
    )
    
    # Job Seeker Fields
    resume = models.FileField(
        upload_to='resumes/', 
        blank=True, null=True, 
        verbose_name="Resume (PDF)"
    )
    skills = models.TextField(
        blank=True, 
        verbose_name="Skills & Experience"
    )
    portfolio_url = models.URLField(
        blank=True, 
        verbose_name="Portfolio Link"
    )
    
    # Employer Fields
    company_website = models.URLField(
        blank=True, 
        verbose_name="Company Website"
    )
    company_description = models.TextField(
        blank=True, 
        verbose_name="Company Description"
    )
    
    @property
    def profile_picture_url(self):
        """Get the profile picture URL or return None."""
        if self.profile_picture:
            return self.profile_picture.url
        return None

    def __str__(self):
        return f"Profile of {self.user.username}"