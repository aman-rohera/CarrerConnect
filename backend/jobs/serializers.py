from rest_framework import serializers
from .models import JobPost
from souls.serializers import UserSerializer


class JobPostSerializer(serializers.ModelSerializer):
    """Serializer for JobPost model."""
    posted_by = UserSerializer(read_only=True)
    posted_by_id = serializers.IntegerField(write_only=True, required=False)
    job_type_display = serializers.CharField(source='get_job_type_display', read_only=True)
    applications_count = serializers.SerializerMethodField()
    
    class Meta:
        model = JobPost
        fields = [
            'id',
            'posted_by',
            'posted_by_id',
            'title',
            'description',
            'location',
            'salary_range',
            'job_type',
            'job_type_display',
            'posted_at',
            'applications_count',
        ]
        read_only_fields = ['id', 'posted_by', 'posted_at', 'applications_count']
    
    def get_applications_count(self, obj):
        return obj.applications.count()


class JobPostCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating JobPost."""
    
    class Meta:
        model = JobPost
        fields = [
            'title',
            'description',
            'location',
            'salary_range',
            'job_type',
        ]


class JobListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for job listings."""
    posted_by_name = serializers.CharField(source='posted_by.username', read_only=True)
    organization_name = serializers.CharField(source='posted_by.organization_name', read_only=True)
    job_type_display = serializers.CharField(source='get_job_type_display', read_only=True)
    
    class Meta:
        model = JobPost
        fields = [
            'id',
            'title',
            'location',
            'salary_range',
            'job_type',
            'job_type_display',
            'posted_at',
            'posted_by_name',
            'organization_name',
        ]
