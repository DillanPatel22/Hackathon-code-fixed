from django.db import models
from django.contrib.auth.models import User

# Create your models here.
class Order(models.Model):
    user_id = models.IntegerField(default=0)
    username = models.CharField(max_length=150, null=True)
    item_id = models.IntegerField()
    item_name = models.CharField(max_length=100)
    item_quantity = models.IntegerField()
    status = models.CharField(max_length=50, default="Pending")
    created_on = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'inventory_order'  # Add this to match the expected table name

    def __str__(self):
        return f"{self.item_name} (User {self.user_id})"