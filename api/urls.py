from django.urls import path
from .views import RoomView, CreateRoomView, RoomInfo

urlpatterns = [
    path('room', RoomView.as_view()),
    path('create-room', CreateRoomView.as_view()),
    path('room-info', RoomInfo.as_view())
]
