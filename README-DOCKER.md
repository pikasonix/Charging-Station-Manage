# Hướng dẫn chạy Backend + PostgreSQL với Docker

## Yêu cầu
- Docker Desktop đã cài đặt và đang chạy
- Docker Compose

## Các bước thực hiện

### 1. Cấu hình Email (Tùy chọn)
Nếu cần chức năng gửi email:
```bash
# Copy file .env.example thành .env
cp .env.example .env

# Chỉnh sửa file .env với thông tin email thật
```

**Lưu ý**: Để lấy App Password cho Gmail:
1. Vào https://myaccount.google.com/security
2. Bật "2-Step Verification"
3. Tạo "App Password" tại https://myaccount.google.com/apppasswords

### 2. Chạy Backend và PostgreSQL
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

### 3. Chạy Frontend (Local - không dùng Docker)
Mở terminal mới:
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
- **Frontend**: http://localhost:3000 (chạy local)

## Các lệnh Docker hữu ích

```bash
# Dừng tất cả services
docker-compose down

# Dừng và xóa volumes (xóa database)
docker-compose down -v

# Rebuild backend (khi có thay đổi code)
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

## Troubleshooting

### Backend không kết nối được PostgreSQL
```bash
# Kiểm tra postgres đã sẵn sàng chưa
docker-compose logs postgres

# Restart backend
docker-compose restart backend
```

### Port đã được sử dụng
Nếu port 8080 hoặc 5432 đã được sử dụng, chỉnh sửa file `docker-compose.yml`:
```yaml
ports:
  - "8081:8080"  # Thay 8080 thành port khác
```

### Xóa hết và bắt đầu lại
```bash
docker-compose down -v
docker-compose up -d --build
```

## Cấu trúc

- **Backend**: Spring Boot chạy trong Docker container
- **PostgreSQL**: Chạy trong Docker container, data được lưu trong volume
- **Frontend**: Chạy local với `npm run dev`, kết nối tới backend qua http://localhost:8080

---

# Hướng dẫn Deploy lên Render

## Yêu cầu
- Tài khoản GitHub
- Tài khoản Render (miễn phí tại https://render.com)
- Code đã được push lên GitHub repository

## Bước 1: Chuẩn bị Repository

### Push code lên GitHub
```bash
git add .
git commit -m "Add Render deployment configuration"
git push origin main
```

### Các file cần thiết đã được tạo:
- `render.yaml` - Cấu hình deployment cho Render
- `backend/Dockerfile.render` - Dockerfile production
- `backend/src/main/resources/application-prod.properties` - Cấu hình production

## Bước 2: Deploy trên Render

### 2.1. Tạo Web Service từ Dashboard

1. Đăng nhập vào https://render.com
2. Click **"New +"** → **"Blueprint"**
3. Connect GitHub repository của bạn
4. Chọn repository `charging_station_management`
5. Render sẽ tự động phát hiện file `render.yaml` và tạo:
   - PostgreSQL Database: `charging-postgres`
   - Web Service: `charging-backend`

### 2.2. Cấu hình Environment Variables

Sau khi tạo services, vào **charging-backend** service và thêm các biến môi trường:

#### Environment Variables cần thiết:
```
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-gmail-app-password
FRONTEND_URL=https://your-frontend-domain.onrender.com
```

**Lưu ý**: 
- `DATABASE_URL` và `JWT_SECRET` đã được tự động tạo bởi Render
- Để lấy Gmail App Password: https://myaccount.google.com/apppasswords

### 2.3. Deploy

1. Render sẽ tự động build và deploy
2. Quá trình build mất khoảng 10-15 phút (lần đầu)
3. Theo dõi logs để kiểm tra tiến trình

## Bước 3: Kiểm tra Deployment

### URLs sau khi deploy:
- **Backend API**: `https://charging-backend.onrender.com`
- **Health Check**: `https://charging-backend.onrender.com/actuator/health`
- **Database**: Internal URL (chỉ backend truy cập được)

### Test API:
```bash
# Kiểm tra health
curl https://charging-backend.onrender.com/actuator/health

# Kiểm tra API endpoint
curl https://charging-backend.onrender.com/api/auth/login
```

## Bước 4: Deploy Frontend (Tuỳ chọn)

Nếu muốn deploy frontend lên Render:

1. Click **"New +"** → **"Static Site"**
2. Chọn repository
3. Cấu hình:
   - **Build Command**: `cd frontend && npm install && npm run build`
   - **Publish Directory**: `frontend/.next` (hoặc `frontend/out` nếu dùng static export)
4. Environment Variables:
   ```
   NEXT_PUBLIC_API_URL=https://charging-backend.onrender.com
   ```

## Lưu ý quan trọng

### Free Tier Limitations:
- **Web Service**: Tự động sleep sau 15 phút không hoạt động
- **PostgreSQL**: 90 ngày expiry trên free tier
- **Spin-up time**: 30-60 giây khi service wake up từ sleep
- **Build minutes**: 500 phút/tháng

### Best Practices:
1. **Auto-deploy**: Render tự động deploy khi push code mới lên GitHub
2. **Logs**: Xem logs tại Dashboard → Service → Logs
3. **Environment Variables**: Cập nhật qua Dashboard, không commit vào code
4. **Database Backup**: Export database thường xuyên (free tier không có auto backup)

## Troubleshooting Render

### Service không start:
```bash
# Kiểm tra logs
# Vào Dashboard → charging-backend → Logs

# Các lỗi thường gặp:
# 1. DATABASE_URL không đúng format
# 2. MAIL credentials sai
# 3. Port binding (phải dùng $PORT từ Render)
```

### Database connection error:
- Đảm bảo `DATABASE_URL` đã được set từ database
- Kiểm tra database đã running
- Restart backend service

### Frontend không kết nối được backend:
- Cập nhật CORS trong `application-prod.properties`
- Thêm frontend URL vào `app.cors.allowed-origins`

## Manual Deploy (Alternative)

Nếu không dùng `render.yaml`, có thể tạo từng service manually:

### 1. Tạo PostgreSQL Database:
- New → PostgreSQL
- Name: `charging-postgres`
- Database: `charging_station_db`
- User: `postgres`

### 2. Tạo Web Service:
- New → Web Service
- Connect repository
- Environment: Docker
- Dockerfile path: `./backend/Dockerfile.render`
- Environment variables: như hướng dẫn trên

## Cập nhật sau khi deploy

```bash
# 1. Sửa code local
# 2. Commit và push
git add .
git commit -m "Update feature"
git push origin main

# 3. Render tự động deploy (nếu bật auto-deploy)
# 4. Hoặc manual deploy từ Dashboard
```

## Chi phí (nếu upgrade khỏi Free Tier)

- **Starter Web Service**: $7/month
- **PostgreSQL**: $7/month (1GB RAM, 1GB Storage)
- **Static Site**: Free

## Monitoring

- **Metrics**: Dashboard → Service → Metrics
- **Logs**: Real-time logs trong Dashboard
- **Alerts**: Cấu hình email alerts cho downtime

---

## So sánh Local vs Render

| Feature | Local Docker | Render |
|---------|-------------|---------|
| Setup | `docker-compose up` | Push to GitHub + Click deploy |
| Cost | Free | Free (với limitations) |
| Access | localhost | Public URL |
| Database | Local volume | Managed PostgreSQL |
| SSL/HTTPS | No | Yes (tự động) |
| Auto-deploy | No | Yes (từ GitHub) |
| Uptime | Khi máy bật | 24/7 (trừ sleep time) |
