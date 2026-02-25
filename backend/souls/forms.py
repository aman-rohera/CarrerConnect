from django import forms
from django.contrib.auth.forms import UserCreationForm
from .models import User, UserProfile


class RegistrationForm(UserCreationForm):
    """User registration form."""
    first_name = forms.CharField(label="First Name")
    last_name = forms.CharField(label="Last Name")
    email = forms.EmailField(label="Email Address")
    phone = forms.CharField(label="Phone Number")
    location = forms.CharField(label="Location")

    class Meta:
        model = User
        fields = [
            'user_type', 
            'first_name', 'last_name', 'username', 'email', 
            'phone', 'location', 
            'employer_role', 'organization_name'
        ]

    def __init__(self, *args, **kwargs):
        super(RegistrationForm, self).__init__(*args, **kwargs)
        for field in self.fields:
            self.fields[field].widget.attrs.update({'class': 'form-input'})

    def clean(self):
        cleaned_data = super().clean()
        user_type = cleaned_data.get('user_type')
        org = cleaned_data.get('organization_name')
        role = cleaned_data.get('employer_role')

        if user_type == 'employer':
            if not org:
                self.add_error('organization_name', "Employers must provide an organization name.")
            if not role:
                self.add_error('employer_role', "Please specify if you are HR or Direct Company.")
        
        return cleaned_data


class UserUpdateForm(forms.ModelForm):
    """User update form for basic information."""
    email = forms.EmailField(label="Email Address")
    first_name = forms.CharField(label="First Name")
    last_name = forms.CharField(label="Last Name")

    class Meta:
        model = User
        fields = ['first_name', 'last_name', 'email', 'phone', 'location', 'organization_name']

    def __init__(self, *args, **kwargs):
        super(UserUpdateForm, self).__init__(*args, **kwargs)
        for field in self.fields:
            self.fields[field].widget.attrs.update({'class': 'form-input'})


class UserProfileForm(forms.ModelForm):
    """User profile form for additional details."""
    class Meta:
        model = UserProfile
        fields = ['resume', 'skills', 'portfolio_url', 'company_website', 'company_description']
        widgets = {
            'resume': forms.FileInput(), 
        }

    def __init__(self, *args, **kwargs):
        super(UserProfileForm, self).__init__(*args, **kwargs)
        for field in self.fields:
            self.fields[field].widget.attrs.update({'class': 'form-input'})


class ProfileCompletionForm(forms.ModelForm):
    """Form for completing profile after social auth sign-in."""
    username = forms.CharField(
        label="Username",
        help_text="Choose a unique username"
    )
    
    class Meta:
        model = User
        fields = ['username', 'user_type', 'phone', 'location', 'employer_role', 'organization_name']

    def __init__(self, *args, **kwargs):
        super(ProfileCompletionForm, self).__init__(*args, **kwargs)
        for field in self.fields:
            self.fields[field].widget.attrs.update({'class': 'form-input'})
        self.fields['phone'].required = False
        self.fields['location'].required = False
        self.fields['employer_role'].required = False
        self.fields['organization_name'].required = False

    def clean_username(self):
        username = self.cleaned_data.get('username')
        if User.objects.filter(username=username).exclude(pk=self.instance.pk).exists():
            raise forms.ValidationError("This username is already taken.")
        return username

    def clean(self):
        cleaned_data = super().clean()
        user_type = cleaned_data.get('user_type')
        org = cleaned_data.get('organization_name')
        role = cleaned_data.get('employer_role')

        if user_type == 'employer':
            if not org:
                self.add_error('organization_name', "Employers must provide an organization name.")
            if not role:
                self.add_error('employer_role', "Please specify if you are HR or Direct Company.")
        
        return cleaned_data


# Backwards compatibility aliases
SoulRegistrationForm = RegistrationForm
SoulProfileForm = UserProfileForm