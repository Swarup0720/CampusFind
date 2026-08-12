from rest_framework import permissions
from rest_framework.exceptions import PermissionDenied

class IsStudent(permissions.BasePermission):
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated and request.user.role == 'STUDENT'):
            raise PermissionDenied({'success': False, 'message': 'Student access required.'})
        return True

class IsShopkeeper(permissions.BasePermission):
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated and (request.user.role == 'SHOPKEEPER' or request.user.is_superuser)):
            raise PermissionDenied({'success': False, 'message': 'Shopkeeper access required.'})
        return True

class IsAdminUserOrSuperuser(permissions.BasePermission):
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated and (request.user.role == 'ADMIN' or request.user.is_superuser)):
            raise PermissionDenied({'success': False, 'message': 'Admin access required.'})
        return True
