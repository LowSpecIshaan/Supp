from django.db import models

class SoundCloudToken(models.Model):
    user = models.CharField(max_length=50, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    refresh_token = models.TextField()
    expires_in = models.DateTimeField()
    access_token = models.TextField()
