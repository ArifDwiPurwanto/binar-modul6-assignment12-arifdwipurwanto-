# Database Setup Guide

## Environment Variables

Buat file `.env.local` di root project dengan konfigurasi berikut:

```bash
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=admin123
DB_NAME=workshop_db

# JWT Configuration
JWT_SECRET=super-secret-key-for-workshop-demo-only
```

## Commands

### 1. Test Database Connection

```bash
npm run db-test
```

### 2. Create Database & Tables

```bash
npm run db-create
```

### 3. Drop Database

```bash
npm run db-drop
```

### 4. Reset Database (Drop + Create)

```bash
npm run db-reset
```

## Troubleshooting

### Jika database server tidak ter-update:

1. **Check Environment Variables**

   ```bash
   npm run db-test
   ```

   Pastikan output menunjukkan konfigurasi yang benar.

2. **Check Database Server**

   - Pastikan PostgreSQL running
   - Check port dan host yang benar
   - Verify credentials

3. **Force Environment Load**

   ```bash
   # Di Windows
   set DB_HOST=your-server-ip
   set DB_PORT=5432
   set DB_USER=postgres
   set DB_PASSWORD=your-password
   set DB_NAME=workshop_db
   npm run db-create

   # Di Linux/Mac
   export DB_HOST=your-server-ip
   export DB_PORT=5432
   export DB_USER=postgres
   export DB_PASSWORD=your-password
   export DB_NAME=workshop_db
   npm run db-create
   ```

4. **Check .env.local File**
   - Pastikan file ada di root project
   - Pastikan format benar (tidak ada spasi di sekitar =)
   - Restart terminal setelah edit

## Common Issues

### 1. "ECONNREFUSED"

- PostgreSQL tidak running
- Port salah
- Host address salah

### 2. "28P01" (Authentication Failed)

- Username/password salah
- Database user tidak ada

### 3. "3D000" (Database Doesn't Exist)

- Database belum dibuat
- Run `npm run db-create`

### 4. Environment Variables Not Loading

- File `.env.local` tidak ada
- Format file salah
- Restart terminal/IDE

## Debug Steps

1. **Test Connection**

   ```bash
   npm run db-test
   ```

2. **Check Environment**

   ```bash
   # Windows
   echo %DB_HOST%

   # Linux/Mac
   echo $DB_HOST
   ```

3. **Manual Connection Test**

   ```bash
   psql -h your-host -p 5432 -U postgres -d postgres
   ```

4. **Check PostgreSQL Status**

   ```bash
   # Windows
   net start postgresql

   # Linux
   sudo systemctl status postgresql
   ```

## Server Configuration

Jika menggunakan database server remote:

```bash
# .env.local
DB_HOST=your-server-ip
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your-password
DB_NAME=workshop_db
```

Pastikan:

- Server PostgreSQL running
- Port 5432 terbuka
- User memiliki permission untuk create database
- Firewall mengizinkan koneksi

## Local vs Remote

### Local Database (Default)

```bash
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=admin123
DB_NAME=workshop_db
```

### Remote Database

```bash
DB_HOST=192.168.1.100
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your-password
DB_NAME=workshop_db
```

## Verification

Setelah setup, verify dengan:

1. **Test Connection**

   ```bash
   npm run db-test
   ```

2. **Check Tables**

   - auth
   - users
   - user_roles
   - user_logs
   - user_divisions

3. **Check Data**
   - 1000 users created
   - Password: User123@
   - Indonesian names
