# Hướng dẫn Deploy Backend + PostgreSQL lên Render

## Tổng quan

Deploy ứng dụng Spring Boot + PostgreSQL lên Render sử dụng Docker.

---

## Bước 1: Push code lên GitHub

```bash
git add .
git commit -m "Prepare for Render deployment"
git push origin main
```

---

## Bước 2: Tạo tài khoản và kết nối GitHub

1. Truy cập: https://render.com
2. Đăng ký tài khoản (dùng GitHub để đăng nhập nhanh)
3. Verify email
4. Vào Dashboard: https://dashboard.render.com
5. Click **"New +"** → **"Blueprint"**
6. Click **"Connect GitHub"** → Authorize Render
7. Chọn repository: `charging_station_management`

---

## Bước 3: Deploy từ Blueprint

1. Render tự động phát hiện file `render.yaml`
2. Review các services sẽ được tạo:
   - **charging-postgres**: PostgreSQL 15 Database
   - **charging-backend**: Spring Boot Web Service
3. Click **"Apply"**

Render sẽ tạo 2 services và bắt đầu deploy (~5-10 phút).

---

## Bước 4: Cấu hình Environment Variables

### Truy cập Backend Service
1. Dashboard → **charging-backend**
2. Tab **"Environment"**
3. Click **"Add Environment Variable"**

### Thêm các biến môi trường sau:

```bash
# Database Password (Render tự động set DATABASE_URL)
DB_PASSWORD=your-secure-production-password

# JWT Secret (dùng random string ít nhất 32 ký tự)
JWT_SECRET=your-random-secure-jwt-secret-key-at-least-32-characters

# Email Configuration
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-gmail-app-password

# Frontend URL (Vercel hoặc domain của bạn)
FRONTEND_URL=https://your-frontend-domain.vercel.app

# CORS Origins (ngăn cách bởi dấu phẩy)
CORS_ALLOWED_ORIGINS=https://your-frontend-domain.vercel.app,http://localhost:3000
```

### Cách lấy Gmail App Password:

1. Truy cập: https://myaccount.google.com/security
2. Bật **"2-Step Verification"** (nếu chưa)
3. Vào: https://myaccount.google.com/apppasswords
4. Chọn app: **"Mail"**, device: **"Other"** → nhập **"Render Backend"**
5. Copy mật khẩu 16 ký tự và paste vào `MAIL_PASSWORD`

### ⚠️ Lưu ý bảo mật:

- **KHÔNG BAO GIỜ** commit `DB_PASSWORD`, `JWT_SECRET` thật vào Git
- Chỉ cấu hình trên Render Environment Variables
- File `application-docker.properties` trong Git chỉ chứa placeholders

### Save Changes

Click **"Save Changes"** → Service tự động redeploy.

---

## Bước 5: Kiểm tra Deployment

### 5.1. Theo dõi Logs

1. Dashboard → **charging-backend** → Tab **"Logs"**
2. Chờ đến khi thấy: `Started ChargingStationManagementApplication`

### 5.2. Lấy URL Backend

Dashboard → **charging-backend** → Copy URL, ví dụ:
```
https://charging-backend-xxxx.onrender.com
```

### 5.3. Test API

Mở browser hoặc dùng curl:

```bash
# Health check
curl https://charging-backend-xxxx.onrender.com/actuator/health

# Expected: {"status":"UP"}
```

---

## Bước 6: Cấu hình Frontend

### Trên Vercel (hoặc nơi deploy frontend):

Thêm environment variable:

```bash
NEXT_PUBLIC_API_URL=https://charging-backend-xxxx.onrender.com
```

Redeploy frontend để áp dụng thay đổi.

---

## Database Management

### Xem Database Connection Info

1. Dashboard → **charging-postgres** → Tab **"Info"**
2. Có 2 loại URL:
   - **Internal Database URL**: Backend dùng (tự động)
   - **External Database URL**: Connect từ máy local

### Connect từ Local (DBeaver/pgAdmin)

Sử dụng **External Database URL** từ Render:

```
Hostname: [từ External URL]
Port: [từ External URL]
Database: charging_station_db
Username: postgres
Password: [từ Render Environment Variables]
```

### Backup Database

```bash
# Backup
pg_dump "postgres://user:pass@host:port/db" > backup.sql

# Restore
psql "postgres://user:pass@host:port/db" < backup.sql
```

---

## Auto-Deploy từ GitHub

### Cấu hình Auto-Deploy:

1. Dashboard → **charging-backend** → Tab **"Settings"**
2. Section **"Build & Deploy"**
3. **Auto-Deploy**: Yes (mặc định đã bật)

### Workflow:

```bash
# Local development
git add .
git commit -m "New feature"
git push origin main

# Render tự động:
# 1. Phát hiện commit mới
# 2. Build Docker image
# 3. Deploy version mới
# 4. Zero-downtime deployment
```

---

## Troubleshooting

### Service không start được

**Xem logs:**
```
Dashboard → charging-backend → Logs
```

**Lỗi thường gặp:**

1. **Database connection failed**
   - Đảm bảo `DATABASE_URL` environment variable đã được Render tự động set
   - Kiểm tra postgres service đang running
   - Restart backend service

2. **Port binding error**
   - Render tự động assign port qua `$PORT` env var
   - Dockerfile.render đã cấu hình đúng

3. **Build failed**
   - Kiểm tra logs để tìm lỗi Maven
   - Đảm bảo Java version đúng (17)

### Frontend không kết nối được Backend

1. **Check CORS configuration**
   - Đảm bảo `CORS_ALLOWED_ORIGINS` có URL frontend
   - Redeploy backend sau khi thay đổi

2. **Check Frontend API URL**
   - Vercel env: `NEXT_PUBLIC_API_URL`
   - Phải trỏ đúng backend URL

3. **Check Browser Network tab**
   - F12 → Network → Xem requests
   - Kiểm tra CORS errors

### Email không gửi được

1. **Verify Gmail App Password**
   - Phải dùng App Password, không phải mật khẩu thường
   - 2-Step Verification đã bật

2. **Check environment variables**
   - `MAIL_USERNAME` và `MAIL_PASSWORD` đã set đúng
   - Không có khoảng trắng thừa

---

## Free Tier Limitations

### Service Sleep (15 phút inactive)

- Free tier services tự động sleep sau 15 phút không hoạt động
- Wake-up time: 30-60 giây khi có request đầu tiên
- **Giải pháp**: Upgrade lên Starter plan ($7/month)

### Database (90 ngày)

- Free PostgreSQL expire sau 90 ngày
- Cần backup và migrate
- **Hoặc**: Upgrade lên paid plan

---

## Upgrade to Paid Plan (Optional)

### So sánh:

| Feature | Free | Starter ($7/mo) |
|---------|------|-----------------|
| Sleep | 15 min | Không sleep |
| Database | 90 ngày | Unlimited |
| Build time | 500 min/tháng | Unlimited |
| SSL | ✅ | ✅ |
| Custom domain | ❌ | ✅ |

### Cách Upgrade:

1. Dashboard → Service → **"Upgrade"**
2. Chọn **Starter** plan
3. Thêm payment method
4. Confirm

---

## Tổng kết

### URLs sau khi deploy:

- **Backend**: `https://charging-backend-xxxx.onrender.com`
- **Health**: `https://charging-backend-xxxx.onrender.com/actuator/health`
- **Database**: Internal URL (tự động connect)

### Environment Variables bắt buộc:

✅ `DB_PASSWORD` - Database password  
✅ `JWT_SECRET` - JWT signing key  
✅ `MAIL_USERNAME` - Gmail address  
✅ `MAIL_PASSWORD` - Gmail app password  
✅ `FRONTEND_URL` - Frontend domain  
✅ `CORS_ALLOWED_ORIGINS` - Allowed origins  

### Checklist:

- ✅ Push code lên GitHub
- ✅ Deploy từ Blueprint
- ✅ Cấu hình Environment Variables
- ✅ Test health check
- ✅ Cấu hình frontend URL
- ✅ Enable auto-deploy

---

## Support

- **Render Docs**: https://render.com/docs
- **Community**: https://community.render.com
- **Spring Boot**: https://spring.io/guides

---

**Lưu ý**: File này thay thế cho `DEPLOY-GUIDE.md` cũ. Tập trung vào Render deployment với Docker.
