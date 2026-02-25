from rest_framework import serializers
from .models import Application
from jobs.serializers import JobListSerializer
from souls.serializers import UserSerializer


class ApplicationSerializer(serializers.ModelSerializer):
    """Serializer for Application model."""
    job = JobListSerializer(read_only=True)
    applicant = UserSerializer(read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = Application
        fields = [
            'id',
            'job',
            'applicant',
            'cover_letter',
            'resume',
            'status',
            'status_display',
            'applied_at',
        ]
        read_only_fields = ['id', 'job', 'applicant', 'status', 'applied_at']


class ApplicationCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating applications."""
    use_profile_resume = serializers.BooleanField(write_only=True, required=False, default=False)
    
    class Meta:
        model = Application
        fields = [
            'cover_letter',
            'resume',
            'use_profile_resume',
        ]


class ApplicationStatusUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating application status."""
    
    class Meta:
        model = Application
        fields = ['status']
    
    def validate_status(self, value):
        valid_statuses = ['pending', 'accepted', 'rejected']
        if value not in valid_statuses:
            raise serializers.ValidationError(f"Status must be one of: {', '.join(valid_statuses)}")
        return value


class ApplicationListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for application listings."""
    job_title = serializers.CharField(source='job.title', read_only=True)
    job_location = serializers.CharField(source='job.location', read_only=True)
    organization_name = serializers.CharField(source='job.posted_by.organization_name', read_only=True)
    applicant_name = serializers.CharField(source='applicant.username', read_only=True)
    applicant_email = serializers.CharField(source='applicant.email', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = Application
        fields = [
            'id',
            'job_title',
            'job_location',
            'organization_name',
            'applicant_name',
            'applicant_email',
            'status',
            'status_display',
            'applied_at',
            'resume',
        ]
