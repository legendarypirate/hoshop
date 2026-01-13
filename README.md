# Hoshop - Барааны код удирдлага

Next.js 16 project with PostgreSQL database for managing product codes (барааны код).

## Prerequisites

- Node.js 18+ 
- PostgreSQL database
- npm or yarn

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Database Setup

1. Create a PostgreSQL database named `hos`:
```bash
createdb hos
# or using psql:
psql -U postgres
CREATE DATABASE hos;
```

2. Run the schema SQL to create the table:
```bash
psql -U postgres -d hos -f schema.sql
```

Or manually in psql:
```sql
CREATE TABLE IF NOT EXISTS baraanii_kod (
  id SERIAL PRIMARY KEY,
  kod VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 3. Environment Variables

Create a `.env.local` file in the root directory:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=hos
DB_USER=postgres
DB_PASSWORD=your_password_here
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

## Features

- ✅ Full CRUD operations for product codes (барааны код)
- ✅ Modern UI with shadcn/ui components
- ✅ PostgreSQL database integration
- ✅ TypeScript support
- ✅ Responsive design

## Project Structure

- `app/page.tsx` - Main CRUD interface
- `app/api/baraanii-kod/` - API routes for CRUD operations
- `lib/db.ts` - PostgreSQL connection pool
- `schema.sql` - Database schema
- `components/ui/` - shadcn/ui components

## API Endpoints

- `GET /api/baraanii-kod` - Get all product codes
- `POST /api/baraanii-kod` - Create a new product code
- `PUT /api/baraanii-kod/[id]` - Update a product code
- `DELETE /api/baraanii-kod/[id]` - Delete a product code
