import django_filters
from django_filters.rest_framework import FilterSet
from product.models import Product


class ProductFilter(FilterSet):
    category_name = django_filters.CharFilter(
        field_name='category__name',
        lookup_expr='iexact',
    )
    in_stock = django_filters.BooleanFilter(method='filter_in_stock')

    class Meta:
        model = Product
        fields = {
            'category_id': ['exact'],
            'category': ['exact'],
            'price': ['gt', 'lt', 'gte', 'lte'],
        }

    def filter_in_stock(self, queryset, name, value):
        if value is True:
            return queryset.filter(stock__gt=0)
        if value is False:
            return queryset.filter(stock=0)
        return queryset
