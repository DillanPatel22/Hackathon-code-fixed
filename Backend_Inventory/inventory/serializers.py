from rest_framework import serializers
from .models import Order

class OrderItemSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    item_name = serializers.CharField(max_length=100)
    item_quantity = serializers.IntegerField()
    created_on = serializers.DateTimeField() 
    status = serializers.CharField(max_length=100)
    username = serializers.CharField(max_length=150, required=False)  # Added username field
     
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
        return Order.objects.create(
            user_id=user_id,
            username=username,
            **validated_data
        )
