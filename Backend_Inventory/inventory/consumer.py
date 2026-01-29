import time
from .order_queue import order_queue
from .models import Order
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

class ConsumeOrders:
    def __init__(self):
        self.thread_sleep_time = 5
        self.running = False

    def consume_orders(self):
        self.running = True
        channel_layer = get_channel_layer()
        
        print("Order consumer started...")
        
        while self.running:
            try:
                if not order_queue.empty():
                    order_id = order_queue.get()
                    print(f"Processing order {order_id}...")
                    
                    try:
                        order = Order.objects.get(id=order_id)
                        
                        # Verify order is in Processing state (should be set by admin acceptance)
                        if order.status != "Processing":
                            print(f"Order {order_id} is not in Processing state. Current status: {order.status}")
                            continue
                        
                        # Simulate processing time
                        print(f"Processing order {order_id} for {self.thread_sleep_time} seconds...")
                        time.sleep(self.thread_sleep_time)
                        
                        # Mark as processed
                        order.status = "Processed"
                        order.save()
                        
                        # Send completion update to user
                        if channel_layer:
                            async_to_sync(channel_layer.group_send)(
                                f"user_{order.username}",
                                {
                                    "type": "order_status",
                                    "message": {
                                        "order_id": order.id,
                                        "status": "Processed",
                                        "item_name": order.item_name
                                    }
                                }
                            )
                            
                            # Notify admin portal
                            async_to_sync(channel_layer.group_send)(
                                "admin_orders",
                                {
                                    "type": "order_update",
                                    "message": {
                                        "order_id": order.id,
                                        "action": "completed",
                                        "status": "Processed"
                                    }
                                }
                            )
                        
                        print(f"Order {order_id} processed successfully")
                        
                    except Order.DoesNotExist:
                        print(f"Order {order_id} not found!")
                else:
                    # Sleep briefly if queue is empty
                    time.sleep(0.5)
                    
            except Exception as e:
                print(f"Error processing order: {e}")
                time.sleep(1)

    def stop(self):
        self.running = False

# Global instance
order_consumer = ConsumeOrders()