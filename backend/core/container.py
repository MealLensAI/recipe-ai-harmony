"""
Dependency Injection Container for managing service instances.
This implements the Service Locator pattern for better testability and loose coupling.
"""
from typing import Dict, Any, Optional, Callable
from threading import Lock


class ServiceContainer:
    """
    Thread-safe service container for dependency injection.
    Supports singleton and factory patterns.
    """
    
    def __init__(self):
        self._services: Dict[str, Any] = {}
        self._factories: Dict[str, Callable] = {}
        self._singletons: Dict[str, Any] = {}
        self._lock = Lock()
    
    def register_singleton(self, name: str, instance: Any) -> None:
        """
        Register a singleton service instance.
        
        Args:
            name: Service name/identifier
            instance: Service instance
        """
        with self._lock:
            self._singletons[name] = instance
    
    def register_factory(self, name: str, factory: Callable) -> None:
        """
        Register a factory function for creating service instances.
        
        Args:
            name: Service name/identifier
            factory: Factory function that returns service instance
        """
        with self._lock:
            self._factories[name] = factory
    
    def get(self, name: str) -> Optional[Any]:
        """
        Get a service instance by name.
        
        Args:
            name: Service name/identifier
            
        Returns:
            Service instance or None if not found
        """
        # Check singletons first
        if name in self._singletons:
            return self._singletons[name]
        
        # Check factories
        if name in self._factories:
            with self._lock:
                # Create instance from factory
                instance = self._factories[name]()
                # Cache as singleton
                self._singletons[name] = instance
                return instance
        
        return None
    
    def has(self, name: str) -> bool:
        """
        Check if a service is registered.
        
        Args:
            name: Service name/identifier
            
        Returns:
            True if service is registered, False otherwise
        """
        return name in self._singletons or name in self._factories
    
    def clear(self) -> None:
        """Clear all registered services (useful for testing)"""
        with self._lock:
            self._services.clear()
            self._factories.clear()
            self._singletons.clear()


# Global container instance
_container = ServiceContainer()


def get_container() -> ServiceContainer:
    """Get the global service container instance"""
    return _container


def reset_container() -> None:
    """Reset the global container (useful for testing)"""
    global _container
    _container = ServiceContainer()
