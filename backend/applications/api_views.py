from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Application
from .serializers import (
    ApplicationSerializer,
    ApplicationCreateSerializer,
    ApplicationStatusUpdateSerializer,
    ApplicationListSerializer,
)
from jobs.models import JobPost


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def apply_to_job_api(request, job_id):
    """
    Apply to a job (API endpoint).
    Only job seekers can apply.
    """
    if request.user.user_type != 'job_seeker':
        return Response(
            {'error': 'Only job seekers can apply to jobs.'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    try:
        job = JobPost.objects.get(pk=job_id)
    except JobPost.DoesNotExist:
        return Response({'error': 'Job not found.'}, status=status.HTTP_404_NOT_FOUND)
    
    # Check if already applied
    if Application.objects.filter(job=job, applicant=request.user).exists():
        return Response(
            {'error': 'You have already applied to this job.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    serializer = ApplicationCreateSerializer(data=request.data)
    if serializer.is_valid():
        application = Application(
            job=job,
            applicant=request.user,
            cover_letter=serializer.validated_data.get('cover_letter', ''),
        )
        
        # Handle resume
        if 'resume' in request.FILES:
            application.resume = request.FILES['resume']
        elif serializer.validated_data.get('use_profile_resume', False):
            try:
                profile = request.user.profile
                if profile.resume:
                    application.resume = profile.resume.name
            except Exception:
                pass
        
        application.save()
        
        return Response({
            'message': 'Application submitted successfully!',
            'application': ApplicationSerializer(application).data,
        }, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_applications_api(request):
    """
    List all applications for the current job seeker (API endpoint).
    """
    applications = Application.objects.filter(applicant=request.user).order_by('-applied_at')
    serializer = ApplicationListSerializer(applications, many=True)
    return Response({'applications': serializer.data})


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def withdraw_application_api(request, pk):
    """
    Withdraw an application (API endpoint).
    Only the applicant can withdraw, and only if status is 'pending'.
    """
    try:
        application = Application.objects.get(pk=pk, applicant=request.user)
    except Application.DoesNotExist:
        return Response({'error': 'Application not found.'}, status=status.HTTP_404_NOT_FOUND)
    
    if application.status != 'pending':
        return Response(
            {'error': 'You can only withdraw applications that are still pending.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    application.delete()
    return Response({'message': 'Application withdrawn successfully.'}, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def job_applications_api(request, job_id):
    """
    List all applications for a specific job (API endpoint).
    Only the job owner can view.
    """
    try:
        job = JobPost.objects.get(pk=job_id, posted_by=request.user)
    except JobPost.DoesNotExist:
        return Response(
            {'error': 'Job not found or you are not the owner.'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    applications = Application.objects.filter(job=job).order_by('-applied_at')
    serializer = ApplicationListSerializer(applications, many=True)
    return Response({
        'job_title': job.title,
        'applications': serializer.data,
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def application_detail_api(request, pk):
    """
    View a single application (API endpoint).
    Only the job owner or applicant can view.
    """
    try:
        application = Application.objects.get(pk=pk)
    except Application.DoesNotExist:
        return Response({'error': 'Application not found.'}, status=status.HTTP_404_NOT_FOUND)
    
    # Check permissions
    if application.job.posted_by != request.user and application.applicant != request.user:
        return Response(
            {'error': "You don't have permission to view this application."},
            status=status.HTTP_403_FORBIDDEN
        )
    
    serializer = ApplicationSerializer(application)
    return Response(serializer.data)


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def update_application_status_api(request, pk):
    """
    Update application status (API endpoint).
    Only the job owner can update status.
    """
    try:
        application = Application.objects.get(pk=pk)
    except Application.DoesNotExist:
        return Response({'error': 'Application not found.'}, status=status.HTTP_404_NOT_FOUND)
    
    # Only job owner can update status
    if application.job.posted_by != request.user:
        return Response(
            {'error': "You don't have permission to update this application."},
            status=status.HTTP_403_FORBIDDEN
        )
    
    serializer = ApplicationStatusUpdateSerializer(application, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        
        status_messages = {
            'accepted': f'Application from {application.applicant.username} has been accepted.',
            'rejected': f'Application from {application.applicant.username} has been rejected.',
            'pending': f'Application from {application.applicant.username} is pending review.',
        }
        
        return Response({
            'message': status_messages.get(application.status, 'Status updated!'),
            'application': ApplicationSerializer(application).data,
        })
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
