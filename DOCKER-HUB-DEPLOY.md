# Hướng dẫn Deploy qua Docker Hub + GitHub Actions

Quy trình CI/CD tự động:
GitHub (push) → GitHub Actions (build) → Docker Hub (image) → Render (deploy)

---

## Bước 1: Chuẩn bị Docker Hub

1. Đăng ký/Đăng nhập: https://hub.docker.com/
2. Tạo Repository mới:
   - **Name**: `charging-backend`
   - **Visibility**: `Public` (để Render Free có thể pull dễ dàng)
   - Click **Create**

---

## Bước 2: Cấu hình GitHub Secrets

Vào GitHub Repo → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**:

| Secret Name | Giá trị |
|-------------|---------|
| `DOCKERHUB_USERNAME` | Username Docker Hub của bạn (ví dụ: `pikasonix`) |
| `DOCKERHUB_TOKEN` | Password Docker Hub hoặc Access Token (khuyên dùng Token: Account Settings → Security → New Access Token) |
| `RENDER_DEPLOY_HOOK` | URL để trigger deploy (sẽ lấy ở Bước 4, tạm thời để trống hoặc update sau) |

---

## Bước 3: Trigger Build Đầu Tiên

1. Push code lên branch `release`:
   ```bash
   git add .
   git commit -m "Setup CI/CD workflow"
   git push origin release
   ```

2. Vào GitHub Repo → Tab **Actions**:
   - Theo dõi workflow `Deploy to Render`
   - Chờ đến khi xanh (Success) ✅
   - Kiểm tra trên Docker Hub xem đã có image `charging-backend:latest` chưa

---

## Bước 4: Setup Render (Lần đầu)

Sau khi **đã có image** trên Docker Hub:

1. Vào [Render Dashboard](https://dashboard.render.com/)
2. Click **New +** → **Web Service**
3. Chọn **"Deploy an existing image from a registry"**
4. Nhập Image URL:
   ```
   <dockerhub-username>/charging-backend:latest
   ```
   (Ví dụ: `pikasonix/charging-backend:latest`)
5. Click **Next**
6. Cấu hình:
   - **Name**: `charging-backend`
   - **Region**: `Singapore`
   - **Plan**: `Free`
   - **Environment Variables**: (Thêm như hướng dẫn trước)
     - `DATABASE_URL`, `DB_PASSWORD`
     - `JWT_SECRET`
     - `MAIL_USERNAME`, `MAIL_PASSWORD`
     - `FRONTEND_URL`, `CORS_ALLOWED_ORIGINS`
7. Click **Create Web Service**

---

## Bước 5: Kết nối Auto-Deploy (Deploy Hook)

Để Render tự động update khi có image mới:

1. Trong Dashboard service vừa tạo → **Settings**
2. Cuộn xuống phần **Deploy Hook**
3. Copy URL (dạng `https://api.render.com/deploy/srv-xxxxx?key=yyyy`)
4. Quay lại GitHub Repo → Settings → Secrets
5. Tạo/Update secret `RENDER_DEPLOY_HOOK` với URL này

---

## Bước 6: Setup Database (nếu chưa có)

1. Dashboard → **New +** → **PostgreSQL**
2. **Name**: `charging-postgres`
3. **Region**: `Singapore` (quan trọng: phải cùng region với backend)
4. **Plan**: `Free`
5. Lấy `Internal Database URL` và update vào Environment Variables của Backend

---

## Tổng kết Flow

Từ giờ, mỗi khi bạn push code lên `release`:
1. GitHub Actions tự động build
2. Push image mới lên Docker Hub
3. Gọi Deploy Hook của Render
4. Render tự động pull image mới và redeploy

Không cần thao tác thủ công nữa!
