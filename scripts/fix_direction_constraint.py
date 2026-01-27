"""
Fix the direction constraint in causal_links table.

The constraint was too restrictive (direction IN (-1, 1)) which doesn't allow
fractional values like -0.3 that are used for competitor relationships.

This script updates the constraint to allow any value between -1 and 1.
"""

import os
from sqlalchemy import create_engine, text

# Get DATABASE_URL
DATABASE_URL = os.getenv(
    'DATABASE_URL',
    'postgresql://localhost/consequence_ai'
)

# Handle Railway's postgres:// URL
if DATABASE_URL.startswith('postgres://'):
    DATABASE_URL = DATABASE_URL.replace('postgres://', 'postgresql://', 1)

print("Fixing direction constraint in causal_links table...")
print()

engine = create_engine(DATABASE_URL, echo=True)

with engine.connect() as conn:
    # Drop the old constraint
    print("Dropping old constraint...")
    conn.execute(text("ALTER TABLE causal_links DROP CONSTRAINT IF EXISTS chk_direction_values;"))

    # Add new constraint
    print("Adding new constraint...")
    conn.execute(text("ALTER TABLE causal_links ADD CONSTRAINT chk_direction_values CHECK (direction >= -1 AND direction <= 1);"))

    conn.commit()

print()
print("✅ Direction constraint fixed!")
print("   Old: direction IN (-1, 1)")
print("   New: direction >= -1 AND direction <= 1")
print()
