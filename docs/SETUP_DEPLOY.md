# Hướng dẫn Deploy 
Frontend deploy trên Vercel [https://charging-station-manage.vercel.app/admin]
Backend deploy trên Render [https://charging-station-management.onrender.com]
Database - PostgreSQL deploy trên Render [dpg-d541d1ggjchc73figkt0-a.singapore-postgres.render.com]

## 0. Quy trình deploy sử dụng CI/CD Pipeline
Frontend: GitHub (push release) → Vercel (deploy)
Backend: GitHub (push release) → GitHub Actions (build & push) → Docker Hub → Render (deploy)

### Setup:
- Vercel [frontend]
- Github Actions [build & push]
- Docker Hub [Lưu trữ Docker Image]
- Render [backend]
- Render [postgreSQL]

## 1. Setup Vercel [#Frontend]
Mục tiêu: Frontend gọi đúng API backend trên Render.

1. Vào Vercel → Project (frontend) → Settings → Environment Variables.
2. Thêm biến:
   - NEXT_PUBLIC_API_URL: URL backend, ví dụ `https://charging-station-management.onrender.com`
3. Redeploy lại Vercel để env có hiệu lực.


## 2. Setup GitHub Secrets [#CI/CD - Github Action]
Mục tiêu: GitHub Actions build image, push Docker Hub và trigger Render deploy.

Trong Repository Settings → Secrets and variables → Actions, thêm:
- DOCKERHUB_USERNAME: Username Docker Hub
- DOCKERHUB_TOKEN: Access Token
- RENDER_DEPLOY_HOOK: Deploy Hook URL của Backend service trên Render

## 3. Setup Render PostgreSQL [#Database]
Mục tiêu: tạo database trên Render và lấy thông tin kết nối cho backend.

1. Trên Render tạo **PostgreSQL** 
2. Sau khi tạo xong, vào trang DB → Connections, lấy các giá trị:
   - Hostname, Port, Database, Username, Password
3. Backend Spring Boot dùng JDBC URL. Khuyến nghị set theo chuẩn Spring như sau (ở Backend service):
   - SPRING_DATASOURCE_URL: `jdbc:postgresql://<HOST>:<PORT>/<DB>`
   - SPRING_DATASOURCE_USERNAME: `<USERNAME>`
   - SPRING_DATASOURCE_PASSWORD: `<PASSWORD>`

### Kết nối pgAdmin local vào PostgreSQL trên Render
Mục tiêu: quản lý DB bằng pgAdmin ở máy local.

1. Trên Render → PostgreSQL → tab **Connections**.
2. Dùng **External Database URL** (hoặc các trường Hostname/Port/Database/Username/Password).
3. Trong pgAdmin (local) → Register → Server:
    - **General → Name**: tuỳ ý (ví dụ: `render-charging-postgres`)
    - **Connection**:
       - Host name/address: hostname External (ví dụ dạng `...singapore-postgres.render.com`)
       - Port: `5432`
       - Maintenance database: đúng tên DB (ví dụ `charging_postgres`)
       - Username/Password: theo Render
    - **SSL**:
       - SSL mode: `require`

Ghi chú:
- Nếu bạn dùng hostname dạng `dpg-...-a` (internal hostname) thì chỉ truy cập được từ service nội bộ trên Render; pgAdmin local cần hostname External.
- Nếu vẫn không kết nối được, kiểm tra cấu hình public access/Trusted IPs của database (tuỳ gói/thiết lập trên Render).

## 4. Setup Render Web Service [#Backend]
Mục tiêu: deploy backend lên Render từ Docker Hub image.

1. Tạo Web Service mới trên Render → chọn "Deploy an existing image from a registry".
2. Image URL: `<dockerhub-username>/charging-backend:latest`
3. Vào Settings của service → tìm mục **Deploy Hook**.
4. Copy Deploy Hook URL và set vào GitHub Secret `RENDER_DEPLOY_HOOK`.
5. Cấu hình Environment Variables (tối thiểu):
   - JWT_SECRET: secret cho JWT (>= 32 ký tự)
   - FRONTEND_URL: `https://charging-station-manage.vercel.app`
   - CORS_ALLOWED_ORIGINS: `https://charging-station-manage.vercel.app`
   - SPRING_DATASOURCE_URL / SPRING_DATASOURCE_USERNAME / SPRING_DATASOURCE_PASSWORD (từ bước 3)

Ghi chú:
- `CORS_ALLOWED_ORIGINS` phải viết trên **một dòng**; nếu nhiều domain thì phân tách bằng dấu phẩy.
- Render tự set `PORT`; backend sẽ tự bind theo `PORT`.

## 5. Migration database (schema/data) [#Migration]
Mục tiêu: cập nhật schema/data một cách có kiểm soát khi deploy.

### Cách 1 (khuyến nghị): Flyway (tự chạy khi app start)
1. Thêm dependency Flyway vào backend (Maven): `org.flywaydb:flyway-core`.
2. Tạo các file SQL trong thư mục: `backend/src/main/resources/db/migration/`
   - Ví dụ: `V1__init.sql`, `V2__add_indexes.sql`, ...
3. Cấu hình khuyến nghị:
   - `spring.flyway.enabled=true`
   - Khi đã có DB sẵn từ trước: `spring.flyway.baseline-on-migrate=true`
   - Giảm rủi ro thay đổi ngoài ý muốn: chuyển `spring.jpa.hibernate.ddl-auto` về `validate` (hoặc `none`) trên môi trường deploy.

#### Lưu ý: Cloud đã có database từ trước
- Với `spring.flyway.baseline-on-migrate=true`: lần chạy đầu tiên trên DB đã có schema, Flyway sẽ **tạo bảng `flyway_schema_history` và ghi “baseline”** (không chạy lại các migration cũ).
- Vì vậy sau khi baseline, bạn nên bắt đầu các migration thật từ **V2__... trở lên** (V1 thường dùng làm baseline/no-op).
- Không đưa các script kiểu `DROP TABLE ...` vào migration trên môi trường production nếu bạn không chủ đích reset dữ liệu.

Khi deploy, Flyway sẽ tự chạy migration theo thứ tự version và ghi lịch sử vào bảng `flyway_schema_history`.

### Cách 2: chạy thủ công qua pgAdmin
- Cấu hình: Server > Register
    - General>Name: tự đặt
    - Connection> [Lấy thông tin tại đây https://dashboard.render.com/d/dpg-d541d1ggjchc73figkt0-a]
        - Host name: dpg-d541d1ggjchc73figkt0-a.singapore-postgres.render.com
        - Port: ...
        - Database: ...
        - Username: ...
        - Password: ...
    - Parameters>
        - SSL mode: require
        
## Workflow chi tiết cho backend
1. **GitHub Actions**:
   - Checkout code
   - Build Maven Project (skip tests)
   - Login Docker Hub
   - Build Docker Image (charging-backend:latest)
   - Push Image lên Docker Hub
   - Gọi Render Deploy Hook

2. **Render**:
   - Nhận tín hiệu từ Deploy Hook
   - Pull Image mới nhất từ Docker Hub
   - Restart Service với code mới
