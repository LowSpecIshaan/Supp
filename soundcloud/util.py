from .models import SoundCloudToken
from django.utils import timezone
from datetime import timedelta
from .credentials import CLIENT_ID, CLIENT_SECRET
from requests import post

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
            refresh_soundcloud_token(tokens)
        return True
        
    return False

def refresh_soundcloud_token(tokens):
    refresh_token = tokens.refresh_token

    response = post("https://secure.soundcloud.com/oauth/token", data={
        "grant_type": "refresh_token",
        "refresh_token": refresh_token,
        "client_id": CLIENT_ID,
        "client_secret": CLIENT_SECRET
    }).json()

    access_token = response.get("access_token")
    expires_in = response.get("expires_in")
    refresh_token = response.get("refresh_token")

    update_or_create_user_tokens(session_id, access_token, refresh_token, expires_in)