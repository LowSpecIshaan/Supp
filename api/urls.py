from django.urls import path
from .views import *

urlpatterns = [
    path('room', RoomView.as_view()),
    path('create-room', CreateRoomView.as_view()),
    path('room-info', RoomInfo.as_view()),
    path('join-room', JoinRoom.as_view()),
    path('user-in-room', UserInRoom.as_view()),
    path('leave-room', LeaveRoom.as_view()),
    path('update-room-settings', UpdateRoomSettings.as_view()),
    path('play-pause-song', PlayPauseSong.as_view()),
    path('current-playback', CurrentPlayback.as_view()),
    path('select-track', SelectTrack.as_view()),
]
