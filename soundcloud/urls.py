from django.urls import path
from .views import *

urlpatterns = [
    path('get-auth-url', AuthURL.as_view()),
    path('redirect', soundcloud_callback),
    path('is-authenticated', IsAuthenticated.as_view()),
    path('soundcloud-search', SoundCloudSearch.as_view())
]