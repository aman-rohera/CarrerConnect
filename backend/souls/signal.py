import os
from django.db.models.signals import post_delete, pre_save
from django.dispatch import receiver
from .models import UserProfile


@receiver(post_delete, sender=UserProfile)
def auto_delete_file_on_delete(sender, instance, **kwargs):
    """Delete file from disk when Profile is deleted."""
    if instance.resume:
        if os.path.isfile(instance.resume.path):
            os.remove(instance.resume.path)


@receiver(pre_save, sender=UserProfile)
def auto_delete_file_on_change(sender, instance, **kwargs):
    """Delete old file from disk when new file is uploaded."""
    if not instance.pk:
        return False

    try:
        old_file = UserProfile.objects.get(pk=instance.pk).resume
    except UserProfile.DoesNotExist:
        return False

    new_file = instance.resume
    
    if old_file and old_file != new_file:
        if os.path.isfile(old_file.path):
            os.remove(old_file.path)