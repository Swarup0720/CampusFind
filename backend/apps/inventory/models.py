from django.db import models
from apps.shops.models import Shop
from apps.products.models import Product, ProductVariant

class Inventory(models.Model):
    shop = models.ForeignKey(Shop, on_delete=models.CASCADE, related_name='inventory_items')
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='inventory_entries')
    variant = models.ForeignKey(
        ProductVariant, on_delete=models.CASCADE, null=True, blank=True, related_name='inventory_entries'
    )
    price = models.DecimalField(max_digits=10, decimal_places=2)
    quantity = models.PositiveIntegerField(default=0)
    reserved_quantity = models.PositiveIntegerField(default=0)
    is_available = models.BooleanField(default=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['shop', 'product', 'variant'], name='unique_shop_product_variant_inventory')
        ]
        verbose_name_plural = 'Inventory Items'

    @property
    def available_quantity(self):
        return max(0, self.quantity - self.reserved_quantity)

    @property
    def item_name(self):
        if self.variant:
            return self.variant.name
        return self.product.name

    def __str__(self):
        name = self.variant.name if self.variant else self.product.name
        return f"{name} @ {self.shop.name} (Stock: {self.available_quantity}/{self.quantity}, ₹{self.price})"
