# apps.py
from django.apps import AppConfig
import threading

class InventoryConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'inventory'

    def ready(self):
        # Start the order consumer when Django starts
        from .consumer import order_consumer
        
        if not hasattr(self, '_consumer_started'):
            self._consumer_started = True
            consumer_thread = threading.Thread(
                target=order_consumer.consume_orders,
                daemon=True
            )
            consumer_thread.start()
            print("Order consumer thread started")