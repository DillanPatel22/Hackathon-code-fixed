from django.urls import path
from . import views

urlpatterns = [
    # User endpoints
    path('orders/', views.save_order, name='order-list'),
    path('orders/user/', views.get_user_orders, name='get_user_orders'),
    
    # Admin endpoints
    path('admin/orders/', views.get_all_orders_admin, name='get_all_orders_admin'),
    path('admin/orders/<int:order_id>/accept/', views.accept_order, name='accept_order'),
    path('admin/orders/<int:order_id>/cancel/', views.cancel_order, name='cancel_order'),

    # Product endpoints
    path('products/search/', views.searchList, name='search_products'),
    path('products/', views.get_all_products, name='get_all_products'),
    path('products/low-stock/', views.get_low_stock_products, name='get_low_stock_products'),
    path('products/<int:product_id>/stock/', views.update_stock, name='update_stock'),

    # Analytics endpoints (NEW)
    path('admin/analytics/sales/', views.get_sales_analytics, name='get_sales_analytics'),
    path('admin/analytics/popular/', views.get_popular_products, name='get_popular_products'),
    path('admin/inventory/stock/', views.get_stock_inventory, name='get_stock_inventory'),
]
