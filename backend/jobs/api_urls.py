from django.urls import path
from . import api_views

urlpatterns = [
    path('', api_views.job_list_api, name='api_job_list'),
    path('create/', api_views.job_create_api, name='api_job_create'),
    path('my-jobs/', api_views.my_jobs_api, name='api_my_jobs'),
    path('<int:pk>/', api_views.job_detail_api, name='api_job_detail'),
    path('<int:pk>/update/', api_views.job_update_api, name='api_job_update'),
    path('<int:pk>/delete/', api_views.job_delete_api, name='api_job_delete'),
]
