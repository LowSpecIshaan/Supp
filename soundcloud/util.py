from .models import SoundCloudToken
from django.utils import timezone
from datetime import timedelta
from requests import post
import os

CLIENT_ID = os.environ.get("CLIENT_ID")
CLIENT_SECRET = os.environ.get("CLIENT_SECRET")


def get_user_tokens(session_id):
    user_tokens = SoundCloudToken.objects.filter(user=session_id)
    if user_tokens.exists():
        return user_tokens.first()
    else:
        return None

def update_or_create_user_tokens(session_id, access_token, refresh_token, expires_in):
    tokens = get_user_tokens(session_id)
    expires_in = timezone.now() + timedelta(seconds=expires_in)

    if tokens:
        tokens.access_token = access_token
        tokens.refresh_token = refresh_token
        tokens.expires_in = expires_in
        tokens.save(update_fields=['access_token', 'refresh_token', 'expires_in'])
    else:
        tokens = SoundCloudToken(user=session_id, access_token=access_token, refresh_token=refresh_token, expires_in=expires_in)
        tokens.save()

def is_soundcloud_authenticated(session_id):
    tokens = get_user_tokens(session_id)
    if tokens:
        expiry = tokens.expires_in
        if expiry <= timezone.now():
            refreshed = refresh_soundcloud_token(session_id, tokens)
            return refreshed
        return True
        
    return False

def refresh_soundcloud_token(session_id, tokens):
    refresh_token = tokens.refresh_token

    response = post("https://secure.soundcloud.com/oauth/token", data={
        "grant_type": "refresh_token",
        "refresh_token": refresh_token,
        "client_id": CLIENT_ID,
        "client_secret": CLIENT_SECRET
    })

    if response.status_code != 200:
        return False
    
    response = response.json()

    access_token = response.get("access_token")
    expires_in = response.get("expires_in")
    refresh_token = response.get("refresh_token")

    if not access_token or not expires_in:
        return False

    update_or_create_user_tokens(session_id, access_token, refresh_token, expires_in)