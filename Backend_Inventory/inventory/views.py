from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from rest_framework.response import Response

from inventory.authentication import JWTAuthenticationWithoutUserDB
from .serializers import OrderSerializer, OrderItemSerializer
from .order_queue import order_queue

from .models import Order
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

inventory_list = ["apple", "banana", "cherries", "apricot", "blueberry"]

@api_view(["GET"])
@authentication_classes([JWTAuthenticationWithoutUserDB])
@permission_classes([IsAuthenticated])
def searchList(request):
    value = request.GET.get('search', '').strip()
    print(value)
    
    matches = []
    for index, item in enumerate(inventory_list):
        if item.lower().startswith(value.lower()):
            matches.append({"id": index, "name": item})

    print(matches)
    return Response(data = {"message": matches}, status = status.HTTP_200_OK)

# Create your views here.
@api_view(["POST"])
@authentication_classes([JWTAuthenticationWithoutUserDB])
@permission_classes([IsAuthenticated])
def save_order(request):
    username = request.headers.get("X-Username")
    
    # Handle list of orders
    orderSerialiser = OrderSerializer(
        data=request.data,
        many=True,
        context={'user_id': request.user.id, 'username': username}
    )
    
    if orderSerialiser.is_valid():
        orders = orderSerialiser.save()
        
        # Notify user via WebSocket that order is pending
        channel_layer = get_channel_layer()
        for order in orders:
            if channel_layer:
                async_to_sync(channel_layer.group_send)(
                    f"user_{username}",
                    {
                        "type": "order_status",
                        "message": {
                            "order_id": order.id,
                            "status": "Pending",
                            "item_name": order.item_name
                        }
                    }
                )
            
            # Notify admin portal of new order
            async_to_sync(channel_layer.group_send)(
                "admin_orders",
                {
                    "type": "order_update",
                    "message": {
                        "order_id": order.id,
                        "action": "new_order",
                        "status": "Pending"
                    }
                }
            )

        return Response(
            data={"message": "Order Created"}, 
            status=status.HTTP_201_CREATED
        )
    
    return Response(
        data={"error": orderSerialiser.errors}, 
        status=status.HTTP_400_BAD_REQUEST
    )

@api_view(["GET"])
@authentication_classes([JWTAuthenticationWithoutUserDB])
@permission_classes([IsAuthenticated])
def get_user_orders(request):
    try:
        username = request.headers.get("X-Username")
        orders = Order.objects.filter(username=username).order_by('-created_on')
        orderSerialiser = OrderItemSerializer(orders, many=True)
        # print(orderSerialiser.data)
        return Response(data={"orders": orderSerialiser.data}, status=status.HTTP_200_OK)
    except Exception as e:
        print(f"Error fetching orders: {str(e)}")
        return Response(
            data={"error": "Failed to fetch orders"}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

# Admin Views
@api_view(["GET"])
@authentication_classes([JWTAuthenticationWithoutUserDB])
@permission_classes([IsAuthenticated])
def get_all_orders_admin(request):
    """Get all orders for admin portal"""
    try:
        # In production, you should check if user has admin privileges
        # For now, we'll allow any authenticated user
        orders = Order.objects.all().order_by('-created_on')
        orderSerialiser = OrderItemSerializer(orders, many=True)
        return Response(data={"orders": orderSerialiser.data}, status=status.HTTP_200_OK)
    except Exception as e:
        print(f"Error fetching admin orders: {str(e)}")
        return Response(
            data={"error": "Failed to fetch orders"}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(["POST"])
@authentication_classes([JWTAuthenticationWithoutUserDB])
@permission_classes([IsAuthenticated])
def accept_order(request, order_id):
    """Accept an order and add it to the processing queue"""
    try:
        order = Order.objects.get(id=order_id)
        
        if order.status != "Pending":
            return Response(
                data={"error": "Only pending orders can be accepted"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Update status to Processing
        order.status = "Processing"
        order.save()
        
        # Add to processing queue
        order_queue.put(order.id)
        
        # Notify user via WebSocket
        channel_layer = get_channel_layer()
        if channel_layer:
            async_to_sync(channel_layer.group_send)(
                f"user_{order.username}",
                {
                    "type": "order_status",
                    "message": {
                        "order_id": order.id,
                        "status": "Processing",
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
                        "action": "accepted",
                        "status": "Processing"
                    }
                }
            )
        
        return Response(
            data={"message": "Order accepted and added to processing queue"}, 
            status=status.HTTP_200_OK
        )
        
    except Order.DoesNotExist:
        return Response(
            data={"error": "Order not found"}, 
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        print(f"Error accepting order: {str(e)}")
        return Response(
            data={"error": "Failed to accept order"}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(["POST"])
@authentication_classes([JWTAuthenticationWithoutUserDB])
@permission_classes([IsAuthenticated])
def cancel_order(request, order_id):
    """Cancel an order"""
    try:
        order = Order.objects.get(id=order_id)
        
        if order.status in ["Processed", "Cancelled"]:
            return Response(
                data={"error": "Cannot cancel processed or already cancelled orders"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Update status to Cancelled
        order.status = "Cancelled"
        order.save()
        
        # Notify user via WebSocket
        channel_layer = get_channel_layer()
        if channel_layer:
            async_to_sync(channel_layer.group_send)(
                f"user_{order.username}",
                {
                    "type": "order_status",
                    "message": {
                        "order_id": order.id,
                        "status": "Cancelled",
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
                        "action": "cancelled",
                        "status": "Cancelled"
                    }
                }
            )
        
        return Response(
            data={"message": "Order cancelled successfully"}, 
            status=status.HTTP_200_OK
        )
        
    except Order.DoesNotExist:
        return Response(
            data={"error": "Order not found"}, 
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        print(f"Error cancelling order: {str(e)}")
        return Response(
            data={"error": "Failed to cancel order"}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )