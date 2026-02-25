from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

# Admin site customization
admin.site.site_header = 'CareerConnect Administration'
admin.site.site_title = 'CareerConnect Admin'
admin.site.index_title = 'Welcome to CareerConnect Admin'

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # API endpoints
    path('api/auth/', include('souls.api_urls')),
    path('api/jobs/', include('jobs.api_urls')),
    path('api/applications/', include('applications.api_urls')),
    
    # Legacy template-based views (can be removed after React migration)
    path('', include('souls.urls')),
    path('jobs/', include('jobs.urls')),
    path('applications/', include('applications.urls')),
    path('accounts/', include('allauth.urls')),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)