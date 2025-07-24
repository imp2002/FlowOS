from typing import TypeVar, Type
from functools import wraps

T = TypeVar('T')

def singleton(cls: Type[T]) -> Type[T]:
    """
    A decorator that makes a class a singleton.
    Usage:
        @singleton
        class MyClass:
            def __init__(self):
                pass
    """
    instances = {}
    
    @wraps(cls)
    def get_instance(*args, **kwargs) -> T:
        if cls not in instances:
            instances[cls] = cls(*args, **kwargs)
        return instances[cls]
    
    return get_instance 