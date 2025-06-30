# Database Migration: Column Naming Convention

This migration updates the database column names from camelCase to snake_case to follow standard database naming conventions.

## Migration Scenarios

### Scenario 1: New Database Setup
If you're setting up a new database, use `database_migration.sql` to create all tables with proper snake_case naming.

### Scenario 2: Existing Database Migration
If you have an existing database with camelCase column names, use `rename_columns_migration.sql` to rename existing columns.

## Migration Steps

### For New Database Setup:

1. **Open your Supabase Dashboard**
   - Go to your Supabase project dashboard
   - Navigate to the SQL Editor

2. **Run the Table Creation Script**
   - Copy and paste the contents of `database_migration.sql` into the SQL editor
   - Execute the script

3. **Verify the Tables**
   - The script includes verification queries that will show the created tables and columns
   - Ensure both `sessions` and `players` tables exist with proper column names

### For Existing Database Migration:

1. **Open your Supabase Dashboard**
   - Go to your Supabase project dashboard
   - Navigate to the SQL Editor

2. **Run the Column Rename Script**
   - Copy and paste the contents of `rename_columns_migration.sql` into the SQL editor
   - Execute the script

3. **Verify the Changes**
   - The script includes a verification query that will show the updated column names
   - Ensure both `pots_taken` and `pots_returned` columns exist

## Database Schema

### Sessions Table
```sql
CREATE TABLE sessions (
    id UUID PRIMARY KEY,
    pot_value DECIMAL(10,2) NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Players Table
```sql
CREATE TABLE players (
    id UUID PRIMARY KEY,
    session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    pots_taken INTEGER DEFAULT 0 NOT NULL,
    pots_returned DECIMAL(10,2) DEFAULT 0 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## What Changed

- `potsTaken` → `pots_taken`
- `potsReturned` → `pots_returned`
- `potValue` → `pot_value`
- `startTime` → `start_time`
- `endTime` → `end_time`
- `isActive` → `is_active`
- `sessionId` → `session_id`

## Code Updates

The following files have been updated to work with the new column names:

- `lib/api.ts` - Updated API functions to use snake_case column names
- `context/PokerContext.tsx` - Added mapping functions to convert between database and TypeScript interfaces
- TypeScript interfaces remain unchanged (still use camelCase for consistency)

## Features Included

- **UUID Primary Keys** - Secure, globally unique identifiers
- **Proper Data Types** - DECIMAL for monetary values, TIMESTAMP for dates
- **Foreign Key Constraints** - Referential integrity between tables
- **Indexes** - Performance optimization for common queries
- **Triggers** - Automatic `updated_at` timestamp updates
- **Row Level Security (RLS)** - Security policies for data access
- **Cascade Deletes** - Automatic cleanup when sessions are deleted

## Benefits

- Follows standard database naming conventions
- Improves code maintainability
- Makes the database schema more professional and consistent 