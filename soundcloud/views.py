import secrets
import hashlib
import base64
from django.shortcuts import render, redirect
from rest_framework.views import APIView
from requests import Request, post, get
from rest_framework import status
from rest_framework.response import Response
from .util import update_or_create_user_tokens, is_soundcloud_authenticated, get_user_tokens
import os

CLIENT_ID = os.environ.get("CLIENT_ID")
CLIENT_SECRET = os.environ.get("CLIENT_SECRET")
REDIRECT_URI = os.environ.get("REDIRECT_URI")

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

class SoundCloudSearch(APIView):
    def get(self, request, format=None):
        query = request.GET.get('q')

        print("Session key:", request.session.session_key)

        if not query:
            return Response({"Message": "No Query Found."}, status = status.HTTP_400_BAD_REQUEST)

        session_id = request.session.session_key

        if not is_soundcloud_authenticated(session_id):
            return Response(
                {"error": "User not authenticated with SoundCloud"},
                status=status.HTTP_401_UNAUTHORIZED
            )

        token = get_user_tokens(session_id).access_token

        sc_response = get(
            "https://api.soundcloud.com/tracks",
            headers={
                "Authorization": f"OAuth {token}"
            },
            params={
                "q": query,
                "limit": 10,
            }
        )

        print("SoundCloud status:", sc_response.status_code)
        print("SoundCloud response:", sc_response.text[:200])

        response = sc_response.json()

        tracks = response if isinstance(response, list) else response.get("collection", [])

        results = []

        for track in tracks:
            results.append({
                "id": track.get("id"),
                "title": track.get("title"),
                "artist": track.get("user", {}).get("username"),
                "artwork": track.get("artwork_url"),
            })

        return Response(results, status= status.HTTP_200_OK)