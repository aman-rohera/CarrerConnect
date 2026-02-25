from django.urls import path
from . import api_views

urlpatterns = [
    path('my/', api_views.my_applications_api, name='api_my_applications'),
    path('apply/<int:job_id>/', api_views.apply_to_job_api, name='api_apply_job'),
    path('<int:pk>/', api_views.application_detail_api, name='api_application_detail'),
    path('<int:pk>/withdraw/', api_views.withdraw_application_api, name='api_withdraw'),
    path('<int:pk>/status/', api_views.update_application_status_api, name='api_update_status'),
    path('job/<int:job_id>/', api_views.job_applications_api, name='api_job_applications'),
]
