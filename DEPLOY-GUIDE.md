# Hu?ng d?n Deploy Charging Station Management lên Render

## T?ng quan

H? th?ng g?m:
- **Backend**: Spring Boot (Java 17)
- **Database**: PostgreSQL 15
- **Frontend**: Next.js (deploy riêng ho?c ch?y local)

## Ph?n 1: Chu?n b?

### 1.1. Ki?m tra các file c?n thi?t

Ð?m b?o repository có các file sau:

\\\
charging_station_management/
+-- render.yaml                                    # C?u hình Render Blueprint
+-- backend/
¦   +-- Dockerfile.render                          # Dockerfile production
¦   +-- src/main/resources/
¦   ¦   +-- application.properties                 # Local config
¦   ¦   +-- application-docker.properties          # Docker local config
¦   ¦   +-- application-prod.properties            # Production config
¦   +-- pom.xml                                    # Maven dependencies (có Actuator)
+-- .env.example                                   # Template cho environment variables
\\\

### 1.2. Push code lên GitHub

\\\ash
# Add t?t c? files
git add .

# Commit
git commit -m "Add Render deployment configuration"

# Push lên GitHub
git push origin main
\\\

## Ph?n 2: Deploy lên Render

### 2.1. T?o tài kho?n Render

1. Truy c?p: https://render.com
2. Ðang ký tài kho?n (có th? dùng GitHub d? dang nh?p)
3. Verify email

### 2.2. Connect GitHub Repository

1. Vào Dashboard: https://dashboard.render.com
2. Click **"New +"** ? **"Blueprint"**
3. Click **"Connect GitHub"** (l?n d?u tiên)
4. Authorize Render truy c?p GitHub repositories
5. Ch?n repository: \charging_station_management\

### 2.3. Deploy t? Blueprint

1. Render s? t? d?ng phát hi?n file \ender.yaml\
2. Review các services s? du?c t?o:
   - \charging-postgres\ - PostgreSQL Database
   - \charging-backend\ - Spring Boot Web Service
3. Click **"Apply"**

Render s? t?o 2 services và b?t d?u deploy.

### 2.4. C?u hình Environment Variables

#### A. Truy c?p Backend Service
1. Vào Dashboard ? **charging-backend**
2. Ch?n tab **"Environment"**

#### B. Thêm Email Configuration
Thêm 2 bi?n môi tru?ng sau:

\\\
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-gmail-app-password
\\\

**Cách l?y Gmail App Password:**
1. Truy c?p: https://myaccount.google.com/security
2. B?t **"2-Step Verification"** (n?u chua b?t)
3. Vào: https://myaccount.google.com/apppasswords
4. Ch?n app: **"Mail"**, device: **"Other"** ? nh?p **"Render Backend"**
5. Copy m?t kh?u 16 ký t? và paste vào \MAIL_PASSWORD\

#### C. C?u hình Frontend URL (sau này)
\\\
FRONTEND_URL=https://your-frontend-domain.onrender.com
\\\

Ho?c n?u frontend ch?y local:
\\\
FRONTEND_URL=http://localhost:3000
\\\

#### D. Save Changes
Click **"Save Changes"** - Service s? t? d?ng redeploy

### 2.5. Theo dõi Deploy Process

1. Vào tab **"Logs"** c?a \charging-backend\
2. Theo dõi quá trình:
   - Building Docker image (~5-10 phút)
   - Starting Spring Boot (~2-3 phút)
3. Ch? d?n khi th?y: **"Started ChargingStationManagementApplication"**

## Ph?n 3: Ki?m tra Deployment

### 3.1. L?y URL c?a Backend

Trong Dashboard ? **charging-backend** ? copy URL, ví d?:
\\\
https://charging-backend-xxxx.onrender.com
\\\

### 3.2. Test Health Check

M? browser ho?c dùng curl:
\\\ash
# Health check endpoint
curl https://charging-backend-xxxx.onrender.com/actuator/health

# Expected response:
{
  "status": "UP"
}
\\\

### 3.3. Test API Endpoints

\\\ash
# Test login endpoint (s? tr? v? error nhung OK vì không có credentials)
curl https://charging-backend-xxxx.onrender.com/api/auth/login

# Test public endpoint (n?u có)
curl https://charging-backend-xxxx.onrender.com/api/public/test
\\\

## Ph?n 4: Deploy Frontend (Optional)

### Option 1: Deploy Frontend lên Render

\\\ash
# 1. Vào Dashboard ? New + ? Static Site
# 2. Connect same repository
# 3. Configure:
\\\

**Build Settings:**
- **Name**: \charging-frontend\
- **Root Directory**: \rontend\
- **Build Command**: \
pm install && npm run build\
- **Publish Directory**: \.next\ (ho?c \out\ n?u dùng static export)

**Environment Variables:**
\\\
NEXT_PUBLIC_API_URL=https://charging-backend-xxxx.onrender.com
\\\

### Option 2: Ch?y Frontend Local

\\\ash
# Trong thu m?c frontend
cd frontend

# T?o .env.local
echo "NEXT_PUBLIC_API_URL=https://charging-backend-xxxx.onrender.com" > .env.local

# Install và ch?y
npm install
npm run dev
\\\

Frontend s? ch?y t?i: http://localhost:3000

## Ph?n 5: C?p nh?t CORS (Quan tr?ng!)

Sau khi có frontend URL, c?p nh?t CORS cho backend:

### 5.1. C?p nh?t application-prod.properties

\\\properties
app.cors.allowed-origins=https://charging-frontend-xxxx.onrender.com,http://localhost:3000
\\\

### 5.2. Push lên GitHub

\\\ash
git add backend/src/main/resources/application-prod.properties
git commit -m "Update CORS for frontend"
git push origin main
\\\

Render s? t? d?ng redeploy backend.

## Ph?n 6: Database Management

### 6.1. Xem Database Info

1. Dashboard ? **charging-postgres**
2. Tab **"Info"** - Xem connection details:
   - Internal Database URL (dùng b?i backend)
   - External Database URL (dùng d? connect t? bên ngoài)

### 6.2. Connect t? Local Machine

Dùng tool nhu **DBeaver** ho?c **pgAdmin**:

\\\
Hostname: [t? External Database URL]
Port: [t? External Database URL]
Database: charging_station_db
Username: postgres
Password: [t? Environment Variables c?a postgres service]
\\\

### 6.3. Backup Database

\\\ash
# S? d?ng pg_dump v?i External URL
pg_dump "postgres://user:password@host:port/database" > backup.sql

# Restore
psql "postgres://user:password@host:port/database" < backup.sql
\\\

## Ph?n 7: Monitoring & Maintenance

### 7.1. Xem Logs

**Real-time logs:**
\\\
Dashboard ? charging-backend ? Logs tab
\\\

**Filter logs:**
- Error logs: Search "ERROR"
- SQL queries: Search "Hibernate"
- Startup logs: Search "Started"

### 7.2. Metrics

\\\
Dashboard ? charging-backend ? Metrics tab
\\\

Theo dõi:
- CPU usage
- Memory usage
- Request count
- Response time

### 7.3. Service Management

**Restart service:**
\\\
Dashboard ? charging-backend ? Manual Deploy ? Deploy Latest Commit
\\\

**View service events:**
\\\
Dashboard ? charging-backend ? Events tab
\\\

## Ph?n 8: Troubleshooting

### 8.1. Service không start du?c

**Ki?m tra logs:**
\\\
Dashboard ? charging-backend ? Logs
\\\

**L?i thu?ng g?p:**

1. **Database connection failed**
   - Ð?m b?o \DATABASE_URL\ environment variable dã du?c set
   - Ki?m tra postgres service dang running
   - Restart backend service

2. **Port binding error**
   - Ð?m b?o Dockerfile.render dùng \\\ environment variable
   - Render t? d?ng assign port

3. **Build failed**
   - Ki?m tra pom.xml syntax
   - Ð?m b?o Java version dúng (17)
   - Xem build logs d? tìm l?i Maven

### 8.2. Frontend không k?t n?i du?c Backend

1. **Check CORS configuration**
   \\\properties
   app.cors.allowed-origins=https://your-frontend.onrender.com
   \\\

2. **Check Frontend API URL**
   \\\ash
   # Frontend .env
   NEXT_PUBLIC_API_URL=https://charging-backend.onrender.com
   \\\

3. **Check Network tab trong browser**
   - M? DevTools ? Network
   - Xem requests t?i backend
   - Ki?m tra CORS errors

### 8.3. Email không g?i du?c

1. **Verify Gmail App Password**
   - Ð?m b?o dùng App Password, không ph?i m?t kh?u thu?ng
   - Check 2-Step Verification dã b?t

2. **Check environment variables**
   \\\
   MAIL_USERNAME=correct-email@gmail.com
   MAIL_PASSWORD=correct-app-password
   \\\

3. **Test email trong logs**
   - Search "mail" trong logs
   - Xem error messages

### 8.4. Free Tier Limitations

**Service sleep sau 15 phút:**
- Free tier web services t? d?ng sleep
- Wake-up time: 30-60 giây khi có request d?u tiên
- Gi?i pháp: Upgrade lên paid plan (\/month)

**Database 90 days expiry:**
- Free PostgreSQL expire sau 90 ngày
- C?n backup và migrate
- Ho?c upgrade lên paid plan

## Ph?n 9: Auto-Deploy Setup

Render t? d?ng deploy khi có code m?i trên GitHub:

### 9.1. Enable Auto-Deploy

1. Dashboard ? **charging-backend**
2. Tab **"Settings"**
3. Section **"Build & Deploy"**
4. **Auto-Deploy**: Yes

### 9.2. Deploy Process

\\\ash
# Local development
git add .
git commit -m "New feature"
git push origin main

# Render automatically:
# 1. Detects new commit
# 2. Triggers build
# 3. Deploys new version
# 4. Zero-downtime deployment
\\\

### 9.3. Deploy Notifications

Configure notifications:
\\\
Settings ? Notifications ? Add email for deploy status
\\\

## Ph?n 10: Upgrade to Paid Plan (Optional)

### Free vs Paid:

| Feature | Free | Starter (\/mo) |
|---------|------|-----------------|
| Sleep | After 15 min | No sleep |
| Database | 90 days | Unlimited |
| Build minutes | 500/month | Unlimited |
| SSL | Yes | Yes |
| Custom domain | No | Yes |

### Upgrade Steps:

1. Dashboard ? Service ? **Upgrade**
2. Ch?n **Starter** plan
3. Add payment method
4. Confirm

## T?ng k?t

**URLs sau khi deploy:**
- Backend: \https://charging-backend-xxxx.onrender.com\
- Health: \https://charging-backend-xxxx.onrender.com/actuator/health\
- Frontend: \https://charging-frontend-xxxx.onrender.com\ (n?u deploy)

**Next steps:**
1. ? Deploy backend + PostgreSQL lên Render
2. ? C?u hình environment variables
3. ? Test API endpoints
4. ? Deploy frontend (optional)
5. ? Setup custom domain (paid plan)
6. ? Configure monitoring & alerts

**Support:**
- Render Docs: https://render.com/docs
- Community: https://community.render.com
