from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions, status
from .services import NaturalSearchService

class SearchAPIView(APIView):
    permission_classes = (permissions.AllowAny,)

    def get(self, request):
        query = request.query_params.get('q', '').strip()
        shop_id = request.query_params.get('shop')
        category_id = request.query_params.get('category')
        max_price_param = request.query_params.get('max_price')

        max_price = float(max_price_param) if max_price_param else None

        if not query and not shop_id and not category_id:
            # Return all available items if empty query
            data = NaturalSearchService.search_inventory("", shop_id=shop_id, category_id=category_id, max_price=max_price)
            return Response(data)

        data = NaturalSearchService.search_inventory(query, shop_id=shop_id, category_id=category_id, max_price=max_price)
        return Response(data)
