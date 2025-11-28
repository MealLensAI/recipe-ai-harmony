"""
Dependency injection helpers for routes.
Provides easy access to services from the DI container.
"""
from typing import Optional
from core.service_registry import get_service
from services.supabase_service import SupabaseService
from services.auth_service import AuthService


def get_supabase_service() -> Optional[SupabaseService]:
    """Get Supabase service from container"""
    return get_service('supabase_service')


def get_auth_service() -> Optional[AuthService]:
    """Get Auth service from container"""
    return get_service('auth_service')


def get_payment_service() -> Optional[any]:
    """Get Payment service from container"""
    return get_service('payment_service')


def get_subscription_service() -> Optional[any]:
    """Get Subscription service from container"""
    return get_service('subscription_service')


def get_lifecycle_service() -> Optional[any]:
    """Get Lifecycle service from container"""
    return get_service('lifecycle_service')


def get_email_service() -> Optional[any]:
    """Get Email service from container"""
    return get_service('email_service')
