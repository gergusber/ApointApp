# Database Management Guide

## 🐳 Docker PostgreSQL Setup

This project uses Docker for local PostgreSQL database development.

### Prerequisites
- Docker Desktop installed and running
- Docker Compose installed

---

## 📦 Available Commands

### Start Database
```bash
npm run db:up
```
Starts PostgreSQL in Docker container (detached mode)

### Stop Database
```bash
npm run db:down
```
Stops the PostgreSQL container (preserves data)

### Reset Database
```bash
npm run db:reset
```
⚠️ **WARNING**: Deletes all data and recreates fresh database

---

## 🔄 Prisma Migrations

### Create a New Migration
```bash
npm run db:migrate
```
Creates a new migration file and applies it to the database.
Prisma will prompt you to name the migration.

Example:
```bash
npm run db:migrate
# Enter a name for the new migration: › add_user_table
```

### Apply Migrations (Production)
```bash
npm run db:migrate:deploy
```
Applies pending migrations without creating new ones.
Use this in production/staging environments.

### Generate Prisma Client
```bash
npm run db:generate
```
Regenerates Prisma Client after schema changes.
Run this after pulling changes that modified `schema.prisma`.

### Push Schema (Development Only)
```bash
npm run db:push
```
⚠️ **For prototyping only**: Pushes schema changes directly without creating migrations.
**Don't use in production!**

---

## 🎨 Prisma Studio
```bash
npm run db:studio
```
Opens Prisma Studio (GUI) at http://localhost:5555 to view/edit database data.

---

## 🌱 Database Seeding
```bash
npm run db:seed
```
Runs the seed script to populate database with initial/test data.

---

## 📊 Typical Workflow

### 1. Initial Setup
```bash
# Start database
npm run db:up

# Create initial migration
npm run db:migrate
# Name: init

# Generate Prisma Client
npm run db:generate
```

### 2. Making Schema Changes
```bash
# 1. Edit prisma/schema.prisma
# 2. Create migration
npm run db:migrate
# Name: descriptive_name (e.g., add_appointments_table)

# Prisma Client is auto-generated during migration
```

### 3. Pulling Changes from Git
```bash
# After pulling schema changes from team
npm run db:migrate
npm run db:generate
```

### 4. Fresh Start (Reset Everything)
```bash
# Delete all data and start over
npm run db:reset

# Recreate migrations
npm run db:migrate
```

---

## 🔍 Database Connection

### Connection String
Located in `.env` file:
```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/appoint_app_dev?schema=public"
```

### Connection Details
- **Host**: localhost
- **Port**: 5432
- **User**: postgres
- **Password**: postgres
- **Database**: appoint_app_dev

---

## 🐛 Troubleshooting

### Container won't start
```bash
# Check if port 5432 is already in use
lsof -i :5432

# If another process is using it, stop it or change port in docker-compose.yml
```

### Migration conflicts
```bash
# Reset migrations (⚠️ DEVELOPMENT ONLY)
npm run db:reset
rm -rf prisma/migrations
npm run db:migrate
# Name: init
```

### Can't connect to database
```bash
# Check if container is running
docker ps

# Check container logs
docker logs appoint-app-db

# Restart container
npm run db:down
npm run db:up
```

---

## 📝 Best Practices

✅ **DO**:
- Create descriptive migration names
- Test migrations before committing
- Keep migrations small and focused
- Use `db:migrate` in development
- Use `db:migrate:deploy` in production
- Commit migration files to Git

❌ **DON'T**:
- Don't use `db:push` in production
- Don't manually edit migration files
- Don't delete old migrations
- Don't reset database with prod data

---

## 🚀 Production Deployment

For production, set `DATABASE_URL` in your hosting provider's environment variables:

```bash
DATABASE_URL="postgresql://user:password@host:5432/database_name?schema=public"
```

Then run:
```bash
npm run db:migrate:deploy
npm run db:generate
```
