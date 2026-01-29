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

    # Product search endpoint
    path('products/search/', views.searchList, name='search_products'),
]