from django.contrib import admin
from .models import Product, Order


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ['name', 'category', 'price', 'stock_quantity', 'low_stock_threshold', 'is_low_stock']
    list_filter = ['category']
    search_fields = ['name', 'description']
    list_editable = ['stock_quantity', 'low_stock_threshold']
    ordering = ['category', 'name']
    
    def is_low_stock(self, obj):
        return obj.is_low_stock
    is_low_stock.boolean = True
    is_low_stock.short_description = 'Low Stock?'


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ['id', 'username', 'item_name', 'item_quantity', 'status', 'created_on']
    list_filter = ['status', 'created_on']
    search_fields = ['username', 'item_name']
    ordering = ['-created_on']
