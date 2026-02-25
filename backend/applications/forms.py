from django import forms
from .models import Application


class ApplicationForm(forms.ModelForm):
    class Meta:
        model = Application
        fields = ['cover_letter', 'resume'] 
        widgets = {
            'cover_letter': forms.Textarea(attrs={
                'class': 'form-input', 
                'rows': 5, 
                'placeholder': 'Why are you interested in this position?'
            }),
        }

    def __init__(self, *args, **kwargs):
        self.user = kwargs.pop('user', None)
        super().__init__(*args, **kwargs)

    def clean(self):
        cleaned_data = super().clean()
        resume = cleaned_data.get('resume')
        use_profile_resume = self.data.get('use_profile_resume')
        
        if not resume and not use_profile_resume:
            self.add_error('resume', 'Resume is required to apply.')
        
        if not resume and use_profile_resume and self.user:
            try:
                if not hasattr(self.user, 'profile') or not self.user.profile.resume:
                    self.add_error('resume', 'You must upload a resume or add one to your profile.')
            except Exception:
                self.add_error('resume', 'You must upload a resume or add one to your profile.')
        return cleaned_data