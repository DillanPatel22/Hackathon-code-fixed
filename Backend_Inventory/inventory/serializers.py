from rest_framework import serializers
from .models import Order, Product


class ProductSerializer(serializers.ModelSerializer):
    """Serializer for Product model"""
    is_low_stock = serializers.BooleanField(read_only=True)
    is_out_of_stock = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = Product
        fields = [
            'id', 'name', 'description', 'category', 'price', 
            'stock_quantity', 'low_stock_threshold', 
            'is_low_stock', 'is_out_of_stock'
        ]


class ProductSearchSerializer(serializers.ModelSerializer):
    """Lightweight serializer for product search results"""
    class Meta:
        model = Product
        fields = ['id', 'name', 'price', 'stock_quantity', 'category']


class LowStockProductSerializer(serializers.ModelSerializer):
    """Serializer for low stock alerts"""
    class Meta:
        model = Product
        fields = ['id', 'name', 'category', 'stock_quantity', 'low_stock_threshold']


class OrderItemSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    item_name = serializers.CharField(max_length=100)
    item_quantity = serializers.IntegerField()
    created_on = serializers.DateTimeField() 
    status = serializers.CharField(max_length=100)
    username = serializers.CharField(max_length=150, required=False)
     
    class Meta:
        model = Order
        fields = ['id', 'user_id', 'username', 'item_id', 'item_name', 'item_quantity', 'status', 'created_on']


class OrderSerializer(serializers.ModelSerializer):
    item_id = serializers.IntegerField()
    item_quantity = serializers.IntegerField()
    
    class Meta:
        model = Order
        fields = ['item_id', 'item_name', 'item_quantity']

    def create(self, validated_data):
        user_id = self.context.get('user_id')
        username = self.context.get('username')
        if not user_id or not username:
            raise serializers.ValidationError("User info missing")
        
        # Try to link to Product model
        product = None
        try:
            product = Product.objects.get(id=validated_data.get('item_id'))
        except Product.DoesNotExist:
            # Try to find by name
            try:
                product = Product.objects.get(name__iexact=validated_data.get('item_name'))
            except Product.DoesNotExist:
                pass
        
        return Order.objects.create(
            user_id=user_id,
            username=username,
            product=product,
            **validated_data
        )
