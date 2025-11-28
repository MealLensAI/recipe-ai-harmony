"""
MySQL Database Client with Connection Pooling
Provides a connection pool and helper methods for MySQL operations.
"""
import os
import mysql.connector
from mysql.connector import pooling, Error
from mysql.connector.pooling import MySQLConnectionPool
from typing import Optional, Dict, Any, List, Tuple
from contextlib import contextmanager
import json
from datetime import datetime
import uuid


class MySQLClient:
    """MySQL database client with connection pooling"""
    
    _pool: Optional[MySQLConnectionPool] = None
    _config: Dict[str, Any] = {}
    
    @classmethod
    def initialize(cls, config: Dict[str, Any]) -> bool:
        """
        Initialize the MySQL connection pool.
        
        Args:
            config: Dictionary with MySQL connection parameters:
                - host: MySQL host (default: localhost)
                - port: MySQL port (default: 3306)
                - user: MySQL username
                - password: MySQL password
                - database: Database name
                - pool_name: Pool name (default: meallens_pool)
                - pool_size: Pool size (default: 5)
                - pool_reset_session: Reset session (default: True)
        
        Returns:
            True if initialization successful, False otherwise
        """
        try:
            cls._config = {
                'host': config.get('host', 'localhost'),
                'port': config.get('port', 3306),
                'user': config.get('user', 'root'),
                'password': config.get('password', '122024Clux!'),
                'database': config.get('database', 'meallens_dev_db'),
                'pool_name': config.get('pool_name', 'meallens_pool'),
                'pool_size': config.get('pool_size', 5),
                'pool_reset_session': config.get('pool_reset_session', True),
                'charset': 'utf8mb4',
                'collation': 'utf8mb4_unicode_ci',
                'autocommit': False,  # Use transactions explicitly
                'raise_on_warnings': True
            }
            
            cls._pool = pooling.MySQLConnectionPool(**cls._config)
            print(f"[INFO] MySQL connection pool initialized: {cls._config['pool_name']}")
            return True
        except Error as e:
            print(f"[ERROR] Failed to initialize MySQL pool: {e}")
            return False
    
    @classmethod
    @contextmanager
    def get_connection(cls):
        """
        Get a connection from the pool (context manager).
        
        Usage:
            with MySQLClient.get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("SELECT * FROM users")
                result = cursor.fetchall()
        """
        if not cls._pool:
            raise RuntimeError("MySQL pool not initialized. Call MySQLClient.initialize() first.")
        
        conn = None
        try:
            conn = cls._pool.get_connection()
            yield conn
            conn.commit()  # Auto-commit on successful exit
        except Error as e:
            if conn:
                conn.rollback()
            raise e
        finally:
            if conn and conn.is_connected():
                conn.close()
    
    @classmethod
    def execute_query(cls, query: str, params: Tuple = None, fetch: bool = True) -> Tuple[Optional[List[Dict]], Optional[str]]:
        """
        Execute a SELECT query and return results.
        
        Args:
            query: SQL query string
            params: Query parameters (tuple)
            fetch: Whether to fetch results (default: True)
        
        Returns:
            Tuple of (results_list, error_message)
        """
        try:
            with cls.get_connection() as conn:
                cursor = conn.cursor(dictionary=True)
                cursor.execute(query, params or ())
                
                if fetch:
                    results = cursor.fetchall()
                    # Convert datetime objects to ISO strings
                    for row in results:
                        for key, value in row.items():
                            if isinstance(value, datetime):
                                row[key] = value.isoformat()
                            elif isinstance(value, bytes):
                                # Handle JSON/BLOB fields
                                try:
                                    row[key] = json.loads(value.decode('utf-8'))
                                except:
                                    row[key] = value.decode('utf-8')
                    return results, None
                else:
                    return [], None
        except Error as e:
            return None, str(e)
    
    @classmethod
    def execute_update(cls, query: str, params: Tuple = None) -> Tuple[bool, Optional[str], Optional[int]]:
        """
        Execute an INSERT/UPDATE/DELETE query.
        
        Args:
            query: SQL query string
            params: Query parameters (tuple)
        
        Returns:
            Tuple of (success, error_message, last_insert_id)
        """
        try:
            with cls.get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute(query, params or ())
                last_id = cursor.lastrowid
                conn.commit()
                return True, None, last_id
        except Error as e:
            return False, str(e), None
    
    @classmethod
    def execute_many(cls, query: str, params_list: List[Tuple]) -> Tuple[bool, Optional[str]]:
        """
        Execute a query multiple times with different parameters.
        
        Args:
            query: SQL query string
            params_list: List of parameter tuples
        
        Returns:
            Tuple of (success, error_message)
        """
        try:
            with cls.get_connection() as conn:
                cursor = conn.cursor()
                cursor.executemany(query, params_list)
                conn.commit()
                return True, None
        except Error as e:
            return False, str(e)
    
    @classmethod
    def generate_uuid(cls) -> str:
        """Generate a UUID string (MySQL compatible)"""
        return str(uuid.uuid4())
    
    @classmethod
    def json_encode(cls, data: Any) -> str:
        """Encode Python object to JSON string for MySQL JSON column"""
        return json.dumps(data) if data is not None else 'null'
    
    @classmethod
    def json_decode(cls, json_str: str) -> Any:
        """Decode JSON string from MySQL JSON column"""
        if json_str is None:
            return None
        if isinstance(json_str, str):
            try:
                return json.loads(json_str)
            except:
                return json_str
        return json_str


def get_mysql_client() -> Optional[MySQLClient]:
    """Get MySQL client instance (for dependency injection)"""
    if MySQLClient._pool is None:
        
        # Try to initialize from environment
        config = {
            'host': os.environ.get('MYSQL_HOST', 'localhost'),
            'port': int(os.environ.get('MYSQL_PORT', 3306)),
            'user': os.environ.get('MYSQL_USER', 'root'),
            'password': os.environ.get('MYSQL_PASSWORD', '122024Clux!'),
            'database': os.environ.get('MYSQL_DATABASE', 'meallens_dev_db'),
            'pool_size': int(os.environ.get('MYSQL_POOL_SIZE', 5))
        }
        MySQLClient.initialize(config)
    return MySQLClient if MySQLClient._pool else None
