import json
from channels.generic.websocket import AsyncWebsocketConsumer

class OrderStatusConsumer(AsyncWebsocketConsumer):
    """WebSocket consumer for user order status updates"""
    async def connect(self):
        self.username = self.scope['url_route']['kwargs'].get('username')
        self.room_group_name = f'user_{self.username}'

        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        await self.accept()

    async def disconnect(self, close_code):
        # Leave room group
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    # Receive message from room group
    async def order_status(self, event):
        message = event['message']

        # Send message to WebSocket
        await self.send(text_data=json.dumps({
            'type': 'order_status',
            'data': message
        }))


class AdminOrderConsumer(AsyncWebsocketConsumer):
    """WebSocket consumer for admin order updates"""
    async def connect(self):
        self.room_group_name = 'admin_orders'

        # Join admin room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        await self.accept()

    async def disconnect(self, close_code):
        # Leave admin room group
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    # Receive message from room group
    async def order_update(self, event):
        message = event['message']

        # Send message to WebSocket
        await self.send(text_data=json.dumps({
            'type': 'order_update',
            'data': message
        }))