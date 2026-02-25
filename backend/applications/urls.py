from django.urls import path
from . import views

urlpatterns = [
    path('apply/<int:job_id>/', views.apply_to_job, name='apply_to_job'),
    path('my-applications/', views.my_applications, name='my_applications'),
    path('withdraw/<int:pk>/', views.withdraw_application, name='withdraw_application'),
    path('job/<int:job_id>/applications/', views.job_applications, name='job_applications'),
    path('<int:pk>/', views.application_detail, name='application_detail'),
    path('<int:pk>/update-status/', views.update_status, name='update_status'),
]
