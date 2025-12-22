# Hướng dẫn chạy Frontend - Backend - PostgreSQL

## Yêu cầu Docker
- **Docker Desktop** đã cài đặt và đang chạy
- **Docker Compose v2+**

## Yêu cầu chạy Local (không dùng docker)
- **Java JDK 17+**
- **Maven 3.8+** (hoặc dùng \`mvnw\` có sẵn)
- **PostgreSQL 15**
- **Node.js 18+**

## Tạo file môi trường
```bash
# frontend
cd frontend
cp .env.example .env.local

# backend
cd backend/src/main/resources
cp application.properties.example application.properties
# bổ sung các tham số phù hợp [đọc README của frontend và backend tương ứng]
```

### 2. Chạy Backend và PostgreSQL
- Docker:
```bash
# Chạy tất cả services (backend + postgres)
docker-compose up -d

# Xem logs
docker-compose logs -f

# Chỉ xem logs backend
docker-compose logs -f backend

# Chỉ xem logs postgres
docker-compose logs -f postgres
```
- Local - không dùng Docker
```bash
cd backend
# Windows
./mvnw.cmd spring-boot:run

# macOS / Linux
./mvnw spring-boot:run
```

### 3. Chạy Frontend (Local - không dùng Docker)
```bash
cd frontend
npm install
npm run dev
```

## Kiểm tra services

- **Backend API**: http://localhost:8080
- **PostgreSQL**: localhost:5432
  - Database: `charging_station_db`
  - Username: `postgres`
  - Password: `admin`
- **Frontend**: http://localhost:3000

## Các lệnh Docker khác

```bash
# Dừng tất cả services
docker-compose down

# Dừng và xóa volumes (xóa database)
docker-compose down -v

# Rebuild backend
docker-compose up -d --build backend

# Restart service
docker-compose restart backend

# Xem trạng thái
docker-compose ps

# Vào backend container
docker exec -it charging_backend bash

# Vào postgres container
docker exec -it charging_postgres psql -U postgres -d charging_station_db
```

## Kết nối Database từ tool khác

Sử dụng các thông tin sau để kết nối từ DBeaver, pgAdmin, hoặc tool khác:
- Host: `localhost`
- Port: `5432`
- Database: `charging_station_db`
- Username: `postgres`
- Password: `admin`