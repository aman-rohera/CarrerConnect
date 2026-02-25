from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, UserProfile


class UserAdmin(BaseUserAdmin):
    model = User
    
    list_display = ['username', 'email', 'user_type', 'location', 'organization_name', 'is_staff']
    list_filter = ['user_type', 'is_staff']

    fieldsets = BaseUserAdmin.fieldsets + (
        ('User Information', {'fields': ('user_type', 'phone', 'location')}),
        ('Employer Details', {'fields': ('employer_role', 'organization_name')}),
    )
    
    add_fieldsets = BaseUserAdmin.add_fieldsets + (
        (None, {'fields': ('user_type', 'phone', 'location', 'email')}),
    )


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'company_website') 
    search_fields = ('user__username', 'user__email')


admin.site.register(User, UserAdmin)