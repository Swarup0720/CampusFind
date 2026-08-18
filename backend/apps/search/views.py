import json
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions, status
from .services import ProductClarificationService

class SearchAPIView(APIView):
    permission_classes = (permissions.AllowAny,)

    def get(self, request):
        query = request.query_params.get('q', '').strip()
        shop_id = request.query_params.get('shop')
        category_id = request.query_params.get('category')
        max_price_param = request.query_params.get('max_price')
        selected_option_id = request.query_params.get('selected_option_id')
        context_str = request.query_params.get('context')

        max_price = float(max_price_param) if max_price_param else None
        opt_id = int(selected_option_id) if selected_option_id else None

        context = {}
        if context_str:
            try:
                context = json.loads(context_str)
            except Exception:
                pass

        data = ProductClarificationService.search_and_clarify(
            raw_query=query,
            context=context,
            selected_option_id=opt_id,
            shop_id=int(shop_id) if shop_id else None,
            category_id=int(category_id) if category_id else None,
            max_price_param=max_price
        )
        return Response(data)

    def post(self, request):
        query = request.data.get('q', '').strip()
        context = request.data.get('context') or {}
        selected_option_id = request.data.get('selected_option_id')
        shop_id = request.data.get('shop_id')
        category_id = request.data.get('category_id')
        max_price = request.data.get('max_price')

        data = ProductClarificationService.search_and_clarify(
            raw_query=query,
            context=context,
            selected_option_id=int(selected_option_id) if selected_option_id else None,
            shop_id=int(shop_id) if shop_id else None,
            category_id=int(category_id) if category_id else None,
            max_price_param=float(max_price) if max_price else None
        )
        return Response(data)
