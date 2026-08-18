import uuid
from django.db import models

class Category(models.Model):
    name = models.CharField(max_length=100, unique=True, db_index=True)
    description = models.TextField(blank=True, default='')
    is_active = models.BooleanField(default=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = 'Categories'
        ordering = ['name']

    def __str__(self):
        return self.name


class ProductAttribute(models.Model):
    name = models.CharField(max_length=100, db_index=True)  # e.g., Color, Size, Filling, Type
    category = models.ForeignKey(
        Category, on_delete=models.SET_NULL, null=True, blank=True, related_name='attributes'
    )
    data_type = models.CharField(max_length=50, default='text')  # text, select, number
    is_required = models.BooleanField(default=False)
    is_filterable = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']
        constraints = [
            models.UniqueConstraint(fields=['category', 'name'], name='unique_category_attribute')
        ]

    def __str__(self):
        cat_str = f" ({self.category.name})" if self.category else " (Global)"
        return f"{self.name}{cat_str}"


class AttributeOption(models.Model):
    attribute = models.ForeignKey(
        ProductAttribute, on_delete=models.CASCADE, related_name='options'
    )
    value = models.CharField(max_length=100, db_index=True)  # e.g., blue, red, chicken, paneer
    display_name = models.CharField(max_length=100)          # e.g., Blue, Red, Chicken, Paneer
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['attribute', 'display_name']
        constraints = [
            models.UniqueConstraint(fields=['attribute', 'value'], name='unique_attribute_option')
        ]

    def __str__(self):
        return f"{self.attribute.name}: {self.display_name}"


class Product(models.Model):
    name = models.CharField(max_length=255, db_index=True)
    description = models.TextField(blank=True, default='')
    category = models.ForeignKey(
        Category, on_delete=models.SET_NULL, null=True, blank=True, related_name='products'
    )
    base_price = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    brand = models.CharField(max_length=100, blank=True, default='', db_index=True)
    image = models.CharField(max_length=500, blank=True, default='')
    unit = models.CharField(max_length=50, default='piece')
    has_variants = models.BooleanField(default=False)
    attributes = models.ManyToManyField(ProductAttribute, blank=True, related_name='products')
    is_active = models.BooleanField(default=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return f"{self.name} ({self.category.name if self.category else 'No Category'})"


class ProductVariant(models.Model):
    product = models.ForeignKey(
        Product, on_delete=models.CASCADE, related_name='variants'
    )
    sku = models.CharField(max_length=100, unique=True, blank=True, db_index=True)
    name = models.CharField(max_length=255, db_index=True)  # e.g., Blue Pen, Paneer Roll
    price = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    attribute_options = models.ManyToManyField(
        AttributeOption, blank=True, related_name='variants'
    )
    image = models.CharField(max_length=500, blank=True, default='')
    is_active = models.BooleanField(default=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['product', 'name']

    def save(self, *args, **kwargs):
        if not self.sku:
            code = uuid.uuid4().hex[:8].upper()
            prod_prefix = "".join([c for c in self.product.name if c.isalnum()])[:4].upper()
            self.sku = f"SKU-{prod_prefix}-{code}"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.name} (₹{self.price})"
