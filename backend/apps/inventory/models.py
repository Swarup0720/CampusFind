from django.db import models
from apps.shops.models import Shop
from apps.products.models import Product

class Inventory(models.Model):
    shop = models.ForeignKey(Shop, on_delete=models.CASCADE, related_name='inventory_items')
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='inventory_entries')
    price = models.DecimalField(max_digits=10, decimal_places=2)
    quantity = models.PositiveIntegerField(default=0)
    reserved_quantity = models.PositiveIntegerField(default=0)
    is_available = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['shop', 'product'], name='unique_shop_product_inventory')
        ]
        verbose_name_plural = 'Inventory Items'

    @property
    def available_quantity(self):
        return max(0, self.quantity - self.reserved_quantity)

    def __str__(self):
        return f"{self.product.name} @ {self.shop.name} (Stock: {self.available_quantity}/{self.quantity}, ₹{self.price})"
