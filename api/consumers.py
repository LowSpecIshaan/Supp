from channels.generic.websocket import AsyncWebsocketConsumer
from asgiref.sync import sync_to_async
from .models import Room
import json


class RoomConsumer(AsyncWebsocketConsumer):

    async def connect(self):
        self.room_code = self.scope["url_route"]["kwargs"]["room_code"]
        self.room_group = f"music_room_{self.room_code}"

        await self.channel_layer.group_add(self.room_group, self.channel_name)
        await self.accept()

        # ⭐ SEND CURRENT STATE IMMEDIATELY (like polling)
        try:
            room = await sync_to_async(Room.objects.get)(code=self.room_code)

            await self.send(text_data=json.dumps({
                "track_id": room.current_track_id,
                "state": "play" if room.is_playing else "pause"
            }))

        except Room.DoesNotExist:
            pass

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.room_group, self.channel_name)

    async def track_update(self, event):
        await self.send(text_data=json.dumps(event["data"]))
