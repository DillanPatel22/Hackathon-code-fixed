# inventory/routing.py
from django.urls import re_path
from inventory import websocket_consumer

websocket_urlpatterns = [
    # User WebSocket for order status updates
    re_path(r'ws/orders/(?P<username>\w+)/$', websocket_consumer.OrderStatusConsumer.as_asgi()),
    
    # Admin WebSocket for order management
    re_path(r'ws/admin/orders/$', websocket_consumer.AdminOrderConsumer.as_asgi()),
]