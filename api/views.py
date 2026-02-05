from django.shortcuts import render
from rest_framework import generics, status
from .serializers import RoomSerializer, CreateRoomSerializer, UpdateRoomSerializer
from .models import Room
from rest_framework.views import APIView
from rest_framework.response import Response
from django.http import JsonResponse

# Create your views here.

class RoomView(generics.ListAPIView):
    queryset = Room.objects.all()
    serializer_class = RoomSerializer

class CreateRoomView(APIView):
    serializer_class = CreateRoomSerializer

    def post(self, request, format=None):
        if not self.request.session.exists(self.request.session.session_key):
            self.request.session.create()
        
        serializer = self.serializer_class(data=request.data)
        if serializer.is_valid():
            guest_can_pause = serializer.data.get("guest_can_pause")
            votes_to_skip = serializer.data.get("votes_to_skip")
            host = self.request.session.session_key
            queryset = Room.objects.filter(host=host)
            if queryset.exists():
                room = queryset[0]
                room.guest_can_pause = guest_can_pause
                room.votes_to_skip = votes_to_skip
                room.save(update_fields=['guest_can_pause', 'votes_to_skip'])
                self.request.session['room_code'] = room.code
                return Response(RoomSerializer(room).data, status=status.HTTP_200_OK)
            else:
                room = Room(host = host, guest_can_pause=guest_can_pause, votes_to_skip=votes_to_skip)
                room.save()
                self.request.session['room_code'] = room.code
                return Response(RoomSerializer(room).data, status=status.HTTP_201_CREATED)
            
        return Response({'Bad Request': 'Invalid data...'}, status=status.HTTP_400_BAD_REQUEST)

class RoomInfo(APIView):
    serializer_class = RoomSerializer

    def get(self, request, format=None):
        code = request.GET.get("code")

        if code:
            room = Room.objects.filter(code=code)
            if len(room) > 0:
                data = RoomSerializer(room[0]).data
                data['is_host'] = self.request.session.session_key == room[0].host
                return Response(data, status=status.HTTP_200_OK)
            return Response({'Room Not Found': 'Invalid Room Code.'}, status=status.HTTP_404_NOT_FOUND)
        return Response({'Bad Request': 'Code Parameter Not Found in Request.'}, status=status.HTTP_400_BAD_REQUEST)

class JoinRoom(APIView):
    def post(self, request, format=None):
        if not self.request.session.exists(self.request.session.session_key):
            self.request.session.create()
        
        code = request.data.get('code').upper()
        if code:
            room_result = Room.objects.filter(code=code)
            if len(room_result) > 0:
                room = room_result[0]

                self.request.session['room_code'] = code
                return Response({'message': 'Room Joined.'}, status=status.HTTP_200_OK)
            return Response({'Room Not Found': 'Invalid Room Code.'}, status=status.HTTP_404_NOT_FOUND)
        return Response({'Bad Request': 'Code Parameter Not Found in Request.'}, status=status.HTTP_400_BAD_REQUEST)

class UserInRoom(APIView):
    def get(self, request, format=None):
        if not self.request.session.exists(self.request.session.session_key):
            self.request.session.create()

        room_code = self.request.session.get('room_code')

        if room_code:
            room_result = Room.objects.filter(code=room_code)
            if len(room_result) == 0:
                request.session.pop('room_code', None)
                room_code = None

        data = {    
            'code': room_code
        }

        return JsonResponse(data, status=status.HTTP_200_OK)

class UpdateRoomSettings(APIView):
    serializer_class = UpdateRoomSerializer

    def patch(self, request, format=None):
        if not self.request.session.exists(self.request.session.session_key):
            self.request.session.create()

        serializer = self.serializer_class(data=request.data)
        if serializer.is_valid():
            guest_can_pause = serializer.data.get('guest_can_pause')
            votes_to_skip = serializer.data.get('votes_to_skip')
            code = serializer.data.get('code')

            query_set = Room.objects.filter(code=code)
            if not query_set.exists():
                return Response({'Bad Request': 'Room Not Found.'}, status=status.HTTP_404_NOT_FOUND)
            room = query_set.first()
            user_id = self.request.session.session_key
            if(room.host != user_id):
                return Response({'Bad Request': 'Only hosts can update room settings.'}, status=status.HTTP_403_FORBIDDEN)
            room.guest_can_pause = guest_can_pause
            room.votes_to_skip = votes_to_skip
            room.save(update_fields = ['guest_can_pause', 'votes_to_skip'])
            return Response(RoomSerializer(room).data, status = status.HTTP_200_OK)

        return Response({'Bad Request': 'Invalid Data.'}, status = status.HTTP_400_BAD_REQUEST)

class LeaveRoom(APIView):
    def post(self, request, format=None):
        if 'room_code' in self.request.session:
            self.request.session.pop('room_code')
            host_id = self.request.session.session_key
            room_results = Room.objects.filter(host=host_id)
            if len(room_results) > 0:
                room = room_results[0]
                room.delete()
        return Response({'Message': 'Success'}, status=status.HTTP_200_OK)