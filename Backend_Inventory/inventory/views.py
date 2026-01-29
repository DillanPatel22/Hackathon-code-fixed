from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from rest_framework.response import Response

from inventory.authentication import JWTAuthenticationWithoutUserDB
from .serializers import OrderSerializer, OrderItemSerializer, ProductSearchSerializer, LowStockProductSerializer
from .order_queue import order_queue

from .models import Order, Product
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync


@api_view(["GET"])
@authentication_classes([JWTAuthenticationWithoutUserDB])
@permission_classes([IsAuthenticated])
def searchList(request):
    """Search for products in the inventory database"""
    value = request.GET.get('search', '').strip()
    
    if not value:
        return Response(data={"message": []}, status=status.HTTP_200_OK)
    
    # Search products by name (case-insensitive, starts with)
    products = Product.objects.filter(
        name__istartswith=value,
        stock_quantity__gt=0  # Only show in-stock items
    )[:10]  # Limit to 10 results
    
    # Format response to match frontend expectations
    matches = []
    for product in products:
        matches.append({
            "id": product.id,
            "name": product.name,
            "price": float(product.price),
            "stock": product.stock_quantity,
            "category": product.category
        })
    
    return Response(data={"message": matches}, status=status.HTTP_200_OK)


@api_view(["GET"])
@authentication_classes([JWTAuthenticationWithoutUserDB])
@permission_classes([IsAuthenticated])
def get_all_products(request):
    """Get all products in inventory"""
    try:
        products = Product.objects.all()
        serializer = ProductSearchSerializer(products, many=True)
        return Response(data={"products": serializer.data}, status=status.HTTP_200_OK)
    except Exception as e:
        print(f"Error fetching products: {str(e)}")
        return Response(
            data={"error": "Failed to fetch products"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(["GET"])
@authentication_classes([JWTAuthenticationWithoutUserDB])
@permission_classes([IsAuthenticated])
def get_low_stock_products(request):
    """Get products that are low on stock - for admin alerts"""
    try:
        # Get products where stock_quantity <= low_stock_threshold
        low_stock = []
        products = Product.objects.all()
        for product in products:
            if product.is_low_stock:
                low_stock.append({
                    "id": product.id,
                    "name": product.name,
                    "category": product.category,
                    "stock_quantity": product.stock_quantity,
                    "low_stock_threshold": product.low_stock_threshold,
                    "is_out_of_stock": product.is_out_of_stock
                })
        
        return Response(data={"low_stock_products": low_stock}, status=status.HTTP_200_OK)
    except Exception as e:
        print(f"Error fetching low stock products: {str(e)}")
        return Response(
            data={"error": "Failed to fetch low stock products"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(["POST"])
@authentication_classes([JWTAuthenticationWithoutUserDB])
@permission_classes([IsAuthenticated])
def save_order(request):
    """Create a new order"""
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
    """Get orders for the current user"""
    try:
        username = request.headers.get("X-Username")
        orders = Order.objects.filter(username=username).order_by('-created_on')
        orderSerialiser = OrderItemSerializer(orders, many=True)
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
    """Accept an order, decrement stock, and add to processing queue"""
    try:
        order = Order.objects.get(id=order_id)
        
        if order.status != "Pending":
            return Response(
                data={"error": "Only pending orders can be accepted"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Decrement stock if product is linked
        low_stock_alert = None
        if order.product:
            product = order.product
            if product.stock_quantity >= order.item_quantity:
                product.stock_quantity -= order.item_quantity
                product.save()
                
                # Check if stock is now low
                if product.is_low_stock:
                    low_stock_alert = {
                        "product_id": product.id,
                        "product_name": product.name,
                        "remaining_stock": product.stock_quantity,
                        "threshold": product.low_stock_threshold
                    }
            else:
                return Response(
                    data={"error": f"Insufficient stock. Only {product.stock_quantity} available."}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        # Update status to Processing
        order.status = "Processing"
        order.save()
        
        # Add to processing queue
        order_queue.put(order.id)
        
        # Notify via WebSocket
        channel_layer = get_channel_layer()
        if channel_layer:
            # Notify user
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
            
            # Send low stock alert if applicable
            if low_stock_alert:
                async_to_sync(channel_layer.group_send)(
                    "admin_orders",
                    {
                        "type": "low_stock_alert",
                        "message": low_stock_alert
                    }
                )
        
        response_data = {"message": "Order accepted and added to processing queue"}
        if low_stock_alert:
            response_data["low_stock_alert"] = low_stock_alert
        
        return Response(data=response_data, status=status.HTTP_200_OK)
        
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


@api_view(["POST"])
@authentication_classes([JWTAuthenticationWithoutUserDB])
@permission_classes([IsAuthenticated])
def update_stock(request, product_id):
    """Update stock quantity for a product (admin only)"""
    try:
        product = Product.objects.get(id=product_id)
        new_quantity = request.data.get('stock_quantity')
        
        if new_quantity is None:
            return Response(
                data={"error": "stock_quantity is required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        product.stock_quantity = int(new_quantity)
        product.save()
        
        return Response(
            data={"message": f"Stock updated to {product.stock_quantity}"},
            status=status.HTTP_200_OK
        )
        
    except Product.DoesNotExist:
        return Response(
            data={"error": "Product not found"},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        print(f"Error updating stock: {str(e)}")
        return Response(
            data={"error": "Failed to update stock"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
