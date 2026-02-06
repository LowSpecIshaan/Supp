import secrets
import hashlib
import base64
from django.shortcuts import render, redirect
from .credentials import REDIRECT_URI, CLIENT_SECRET, CLIENT_ID
from rest_framework.views import APIView
from requests import Request, post
from rest_framework import status
from rest_framework.response import Response
from .util import update_or_create_user_tokens, is_soundcloud_authenticated

class AuthURL(APIView):
    def get(self, request, format=None):
        if not request.session.session_key:
            request.session.create()

        # PKCE verifier
        code_verifier = secrets.token_urlsafe(64)
        request.session['code_verifier'] = code_verifier

        # PKCE challenge
        code_challenge = base64.urlsafe_b64encode(
            hashlib.sha256(code_verifier.encode()).digest()
        ).decode().rstrip('=')

        state = secrets.token_urlsafe(16)
        request.session['oauth_state'] = state

        url = Request('GET', "https://secure.soundcloud.com/authorize", params={
            'response_type': 'code',
            'redirect_uri': REDIRECT_URI,
            'client_id': CLIENT_ID,
            'scope': 'non-expiring',
            'state': state,
            'code_challenge': code_challenge,
            'code_challenge_method': 'S256'
        }).prepare().url

        print("Verifier:", code_verifier)
        print("Challenge:", code_challenge)

        return Response({'url': url}, status=status.HTTP_200_OK)

def soundcloud_callback(request, format=None):
    if request.GET.get('error'):
        return Response({'error': 'Authorization denied'})

    code = request.GET.get('code')
    state = request.GET.get('state')

    if state != request.session.get('oauth_state'):
        return Response({'error': 'Invalid state'})

    code_verifier = request.session.get('code_verifier')

    response = post("https://secure.soundcloud.com/oauth/token", data={
        'grant_type': 'authorization_code',
        'client_id': CLIENT_ID,
        'client_secret': CLIENT_SECRET,
        'redirect_uri': REDIRECT_URI,
        'code_verifier': code_verifier,
        'code': code,
    }).json()

    access_token = response.get('access_token')
    refresh_token = response.get('refresh_token')
    expires_in = response.get('expires_in')
    scope = response.get('scope')

    if not request.session.exists(request.session.session_key):
        request.session.create()

    update_or_create_user_tokens(request.session.session_key, access_token, refresh_token, expires_in)

    return redirect('frontend:')

class IsAuthenticated(APIView):
    def get(self, request, format=None):
        is_authenticated = is_soundcloud_authenticated(self.request.session.session_key)
        return Response({"status": is_authenticated}, status = status.HTTP_200_OK)
