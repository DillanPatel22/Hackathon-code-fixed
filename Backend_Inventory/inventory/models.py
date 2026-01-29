from django.db import models
from django.contrib.auth.models import User

# Product Model - Stores laboratory inventory items
class Product(models.Model):
    CATEGORY_CHOICES = [
        ('glassware', 'Glassware'),
        ('chemicals', 'Chemicals'),
        ('equipment', 'Equipment'),
        ('consumables', 'Consumables'),
        ('safety', 'Safety'),
    ]
    
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES, default='consumables')
    price = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    stock_quantity = models.IntegerField(default=0)
    low_stock_threshold = models.IntegerField(default=10)  # Alert when stock falls below this
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'inventory_product'
        ordering = ['category', 'name']

    def __str__(self):
        return f"{self.name} ({self.stock_quantity} in stock)"
    
    @property
    def is_low_stock(self):
        """Returns True if stock is below the threshold"""
        return self.stock_quantity <= self.low_stock_threshold
    
    @property
    def is_out_of_stock(self):
        """Returns True if stock is zero"""
        return self.stock_quantity <= 0


# Order Model - Stores customer orders
class Order(models.Model):
    user_id = models.IntegerField(default=0)
    username = models.CharField(max_length=150, null=True)
    item_id = models.IntegerField()
    item_name = models.CharField(max_length=100)
    item_quantity = models.IntegerField()
    status = models.CharField(max_length=50, default="Pending")
    created_on = models.DateTimeField(auto_now_add=True)
    # Link to Product for stock tracking
    product = models.ForeignKey(Product, on_delete=models.SET_NULL, null=True, blank=True)

    class Meta:
        db_table = 'inventory_order'

    def __str__(self):
        return f"{self.item_name} (User {self.user_id})"
