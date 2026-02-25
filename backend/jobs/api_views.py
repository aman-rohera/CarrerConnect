from rest_framework import status, generics
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from django.db.models import Q

from .models import JobPost
from .serializers import JobPostSerializer, JobPostCreateSerializer, JobListSerializer
from applications.models import Application


class JobPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 50


@api_view(['GET'])
@permission_classes([AllowAny])
def job_list_api(request):
    """
    List all jobs with optional search/filter (API endpoint).
    """
    jobs = JobPost.objects.all().order_by('-posted_at')
    
    # Search by title or location
    query = request.query_params.get('q', '')
    if query:
        jobs = jobs.filter(Q(title__icontains=query) | Q(location__icontains=query))
    
    # Filter by job type (multiple)
    job_types = request.query_params.getlist('type')
    if job_types:
        jobs = jobs.filter(job_type__in=job_types)
    
    # Filter by salary range
    min_salary = request.query_params.get('min_salary')
    max_salary = request.query_params.get('max_salary')
    if min_salary:
        try:
            jobs = jobs.filter(salary_range__gte=int(min_salary))
        except (ValueError, TypeError):
            pass
    if max_salary:
        try:
            jobs = jobs.filter(salary_range__lte=int(max_salary))
        except (ValueError, TypeError):
            pass
    
    # Paginate
    paginator = JobPagination()
    page = paginator.paginate_queryset(jobs, request)
    
    # Get applied job IDs for authenticated job seekers
    applied_job_ids = []
    if request.user.is_authenticated and request.user.user_type == 'job_seeker':
        applied_job_ids = list(Application.objects.filter(applicant=request.user).values_list('job_id', flat=True))
    
    serializer = JobListSerializer(page, many=True)
    
    return paginator.get_paginated_response({
        'jobs': serializer.data,
        'applied_job_ids': applied_job_ids,
    })


@api_view(['GET'])
@permission_classes([AllowAny])
def job_detail_api(request, pk):
    """
    Get a single job posting (API endpoint).
    """
    try:
        job = JobPost.objects.get(pk=pk)
    except JobPost.DoesNotExist:
        return Response({'error': 'Job not found.'}, status=status.HTTP_404_NOT_FOUND)
    
    serializer = JobPostSerializer(job)
    
    # Check if user has applied
    has_applied = False
    if request.user.is_authenticated:
        has_applied = Application.objects.filter(job=job, applicant=request.user).exists()
    
    return Response({
        'job': serializer.data,
        'has_applied': has_applied,
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def job_create_api(request):
    """
    Create a new job posting (API endpoint).
    Only employers can create jobs.
    """
    if request.user.user_type != 'employer':
        return Response(
            {'error': 'Only employers can post jobs.'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    serializer = JobPostCreateSerializer(data=request.data)
    if serializer.is_valid():
        job = serializer.save(posted_by=request.user)
        return Response({
            'message': 'Job posted successfully!',
            'job': JobPostSerializer(job).data,
        }, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['PUT', 'PATCH'])
@permission_classes([IsAuthenticated])
def job_update_api(request, pk):
    """
    Update a job posting (API endpoint).
    Only the job owner can update.
    """
    try:
        job = JobPost.objects.get(pk=pk)
    except JobPost.DoesNotExist:
        return Response({'error': 'Job not found.'}, status=status.HTTP_404_NOT_FOUND)
    
    if job.posted_by != request.user:
        return Response(
            {'error': 'You can only edit your own job postings.'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    serializer = JobPostCreateSerializer(job, data=request.data, partial=True)
    if serializer.is_valid():
        job = serializer.save()
        return Response({
            'message': 'Job updated successfully!',
            'job': JobPostSerializer(job).data,
        })
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def job_delete_api(request, pk):
    """
    Delete a job posting (API endpoint).
    Only the job owner can delete.
    """
    try:
        job = JobPost.objects.get(pk=pk)
    except JobPost.DoesNotExist:
        return Response({'error': 'Job not found.'}, status=status.HTTP_404_NOT_FOUND)
    
    if job.posted_by != request.user:
        return Response(
            {'error': 'You can only delete your own job postings.'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    job.delete()
    return Response({'message': 'Job deleted successfully!'}, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_jobs_api(request):
    """
    List all jobs posted by the current employer (API endpoint).
    """
    if request.user.user_type != 'employer':
        return Response(
            {'error': 'Only employers can view their posted jobs.'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    jobs = JobPost.objects.filter(posted_by=request.user).order_by('-posted_at')
    serializer = JobPostSerializer(jobs, many=True)
    return Response({'jobs': serializer.data})
