"""Database connection management for Consequence AI.

Handles SQLAlchemy engine and session creation.
"""

import os
from typing import Generator
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import NullPool
from contextlib import contextmanager

from .models import Base


# Database URL from environment variable
DATABASE_URL = os.getenv(
    'DATABASE_URL',
    'postgresql://localhost/consequence_ai'  # Default for local development
)

# Handle Railway's postgres:// URL (SQLAlchemy requires postgresql://)
if DATABASE_URL.startswith('postgres://'):
    DATABASE_URL = DATABASE_URL.replace('postgres://', 'postgresql://', 1)


def create_db_engine(database_url: str = DATABASE_URL, **kwargs):
    """Create SQLAlchemy engine with optimized settings.

    Args:
        database_url: PostgreSQL connection string
        **kwargs: Additional engine configuration

    Returns:
        SQLAlchemy Engine instance
    """
    # Default engine settings
    engine_config = {
        'echo': os.getenv('SQL_ECHO', 'false').lower() == 'true',  # Log SQL queries
        'pool_pre_ping': True,  # Verify connections before using
        'pool_size': int(os.getenv('DB_POOL_SIZE', '5')),
        'max_overflow': int(os.getenv('DB_MAX_OVERFLOW', '10')),
    }

    # For serverless/Railway, use NullPool to avoid connection limits
    if os.getenv('RAILWAY_ENVIRONMENT'):
        engine_config['poolclass'] = NullPool

    # Override with provided kwargs
    engine_config.update(kwargs)

    engine = create_engine(database_url, **engine_config)

    # Add connection pool logging if needed
    if os.getenv('DB_DEBUG', 'false').lower() == 'true':
        @event.listens_for(engine, 'connect')
        def receive_connect(dbapi_conn, connection_record):
            print(f"New DB connection established: {id(dbapi_conn)}")

    return engine


# Global engine and session factory
_engine = None
_SessionLocal = None


def init_db(database_url: str = DATABASE_URL):
    """Initialize database engine and session factory.

    Should be called once at application startup.

    Args:
        database_url: PostgreSQL connection string
    """
    global _engine, _SessionLocal

    _engine = create_db_engine(database_url)
    _SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=_engine)

    return _engine


def get_engine():
    """Get the global database engine.

    Raises:
        RuntimeError: If init_db() hasn't been called
    """
    if _engine is None:
        raise RuntimeError("Database not initialized. Call init_db() first.")
    return _engine


def get_session_factory():
    """Get the global session factory.

    Raises:
        RuntimeError: If init_db() hasn't been called
    """
    if _SessionLocal is None:
        raise RuntimeError("Database not initialized. Call init_db() first.")
    return _SessionLocal


@contextmanager
def get_db_session() -> Generator[Session, None, None]:
    """Context manager for database sessions.

    Usage:
        with get_db_session() as session:
            entity = session.query(Entity).filter_by(id='AAPL').first()

    Automatically handles:
    - Session creation
    - Commit on success
    - Rollback on exception
    - Session cleanup
    """
    SessionLocal = get_session_factory()
    session = SessionLocal()

    try:
        yield session
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()


def create_tables(engine=None):
    """Create all database tables.

    Args:
        engine: SQLAlchemy engine (uses global if not provided)
    """
    if engine is None:
        engine = get_engine()

    Base.metadata.create_all(bind=engine)
    print("✅ Database tables created")


def drop_tables(engine=None):
    """Drop all database tables.

    ⚠️ WARNING: This will delete all data!

    Args:
        engine: SQLAlchemy engine (uses global if not provided)
    """
    if engine is None:
        engine = get_engine()

    Base.metadata.drop_all(bind=engine)
    print("⚠️  Database tables dropped")


def reset_database(engine=None):
    """Drop and recreate all tables.

    ⚠️ WARNING: This will delete all data!

    Args:
        engine: SQLAlchemy engine (uses global if not provided)
    """
    drop_tables(engine)
    create_tables(engine)
    print("✅ Database reset complete")
