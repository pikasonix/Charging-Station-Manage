/* ==========================================================================
   1. DROP EXISTING TABLES (Theo thứ tự khóa ngoại để tránh lỗi)
   ========================================================================== */

DROP TABLE IF EXISTS ratings;
DROP TABLE IF EXISTS transactions;
DROP TABLE IF EXISTS charging_sessions;
DROP TABLE IF EXISTS electric_vehicles;
DROP TABLE IF EXISTS prices;
DROP TABLE IF EXISTS charging_connectors;
DROP TABLE IF EXISTS charging_poles;
DROP TABLE IF EXISTS stations;
DROP TABLE IF EXISTS rescue_stations;
DROP TABLE IF EXISTS locations;
DROP TABLE IF EXISTS customers;
DROP TABLE IF EXISTS vendors;
DROP TABLE IF EXISTS admins;
DROP TABLE IF EXISTS users CASCADE;

/* ==========================================================================
   2. CREATE TABLES
   ========================================================================== */

-- 2.1 Bảng cha: users
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(11) NOT NULL,
    status INTEGER,
    user_type VARCHAR(31) NOT NULL -- Discriminator column
);

-- 2.2 Các bảng con kế thừa từ users
CREATE TABLE admins (
    id INTEGER PRIMARY KEY REFERENCES users(id)
);

CREATE TABLE vendors (
    user_id INTEGER PRIMARY KEY REFERENCES users(id)
);

CREATE TABLE customers (
    user_id INTEGER PRIMARY KEY REFERENCES users(id)
);

-- 2.3 Locations
CREATE TABLE locations (
    id SERIAL PRIMARY KEY,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    province VARCHAR(255) NOT NULL,
    address_detail TEXT NOT NULL
);

-- 2.4 Rescue Stations
CREATE TABLE rescue_stations (
    id SERIAL PRIMARY KEY,
    location_id INTEGER NOT NULL REFERENCES locations(id),
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(11) NOT NULL,
    email VARCHAR(255),
    open_time TIME NOT NULL,
    close_time TIME NOT NULL
);

-- 2.5 Stations (Vendor sở hữu)
CREATE TABLE stations (
    id SERIAL PRIMARY KEY,
    vendor_id INTEGER NOT NULL REFERENCES vendors(user_id),
    location_id INTEGER NOT NULL REFERENCES locations(id),
    name VARCHAR(255) NOT NULL,
    open_time TIME NOT NULL,
    close_time TIME NOT NULL,
    status INTEGER,
    type VARCHAR(100) NOT NULL -- Enum: VehicleType
);

-- 2.6 Charging Poles
CREATE TABLE charging_poles (
    id SERIAL PRIMARY KEY,
    station_id INTEGER NOT NULL REFERENCES stations(id),
    manufacturer VARCHAR(255) NOT NULL,
    max_power DECIMAL(10, 2) NOT NULL,
    connector_count INTEGER NOT NULL DEFAULT 1,
    install_date DATE
);

-- 2.7 Charging Connectors
CREATE TABLE charging_connectors (
    id SERIAL PRIMARY KEY,
    pole_id INTEGER NOT NULL REFERENCES charging_poles(id),
    connector_type VARCHAR(100) NOT NULL, -- Enum: ConnectorType
    max_power DECIMAL(10, 2) NOT NULL,
    status VARCHAR(100) NOT NULL -- Enum: ConnectorStatus
);

-- 2.8 Prices
CREATE TABLE prices (
    id SERIAL PRIMARY KEY,
    charging_pole_id INTEGER REFERENCES charging_poles(id),
    name VARCHAR(100) NOT NULL, -- Enum: PriceName
    price DECIMAL(15, 2),
    effective_from DATE NOT NULL,
    effective_to DATE,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL
);

-- 2.9 Electric Vehicles (Customer sở hữu)
CREATE TABLE electric_vehicles (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER NOT NULL REFERENCES customers(user_id),
    vehicle_type VARCHAR(100) NOT NULL, -- Enum: VehicleType
    brand VARCHAR(255) NOT NULL,
    model VARCHAR(255) NOT NULL,
    license_plate VARCHAR(50) NOT NULL UNIQUE,
    battery_capacity DECIMAL(10, 2) NOT NULL,
    connector_type VARCHAR(100) NOT NULL -- Enum: ConnectorType
);

-- 2.10 Charging Sessions
CREATE TABLE charging_sessions (
    id SERIAL PRIMARY KEY,
    electric_vehicle_id INTEGER NOT NULL REFERENCES electric_vehicles(id),
    charging_connector_id INTEGER NOT NULL REFERENCES charging_connectors(id),
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    energy_kwh DECIMAL(10, 2),
    cost DECIMAL(15, 2),
    status VARCHAR(100) NOT NULL -- Enum: SessionStatus
);

-- 2.11 Transactions
CREATE TABLE transactions (
    id SERIAL PRIMARY KEY,
    charging_session_id INTEGER NOT NULL,
    customer_id INTEGER NOT NULL REFERENCES customers(user_id),
    amount DECIMAL(15, 2) NOT NULL,
    payment_method VARCHAR(100) NOT NULL, -- Enum: PaymentMethod
    payment_status VARCHAR(100) NOT NULL, -- Enum: PaymentStatus
    bank_name VARCHAR(255),
    account_number VARCHAR(50),
    payment_time TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 2.12 Ratings
CREATE TABLE ratings (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER NOT NULL REFERENCES customers(user_id),
    target_type VARCHAR(100) NOT NULL, -- Enum: TargetType
    target_id INTEGER NOT NULL,
    stars INTEGER NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    comment TEXT
);

-- Ràng buộc duy nhất cho Ratings
ALTER TABLE ratings ADD CONSTRAINT unique_rating_target UNIQUE (customer_id, target_type, target_id);

/* ==========================================================================
   3. INSERT SAMPLE DATA
   ========================================================================== */

-- 3.1 USERS (Total 5: 1 Admin, 2 Vendors, 2 Customers)
-- Password mặc định: Tramsac@123 -> $2a$12$iTOeSm.NoT8jH6wKIfmrKulOeA90vmz58bmDeBQTdz7eDk2CRZDna

-- User 1: Admin
INSERT INTO users (name, email, password, phone, status, user_type)
VALUES ('System Admin', 'admin@wayo.com', '$2a$12$iTOeSm.NoT8jH6wKIfmrKulOeA90vmz58bmDeBQTdz7eDk2CRZDna', '0909000111', 1, 'ADMIN');
INSERT INTO admins (id) VALUES (1);

-- User 2: Vendor A
INSERT INTO users (name, email, password, phone, status, user_type)
VALUES ('VinCharge Solutions', 'contact@vincharge.vn', '$2a$12$iTOeSm.NoT8jH6wKIfmrKulOeA90vmz58bmDeBQTdz7eDk2CRZDna', '0909222333', 1, 'VENDOR');
INSERT INTO vendors (user_id) VALUES (2);

-- User 3: Vendor B
INSERT INTO users (name, email, password, phone, status, user_type)
VALUES ('E-Point Energy', 'support@epoint.com', '$2a$12$iTOeSm.NoT8jH6wKIfmrKulOeA90vmz58bmDeBQTdz7eDk2CRZDna', '0909444555', 1, 'VENDOR');
INSERT INTO vendors (user_id) VALUES (3);

-- User 4: Customer A (Sẽ có 2 xe)
INSERT INTO users (name, email, password, phone, status, user_type)
VALUES ('Nguyen Van An', 'an.nguyen@gmail.com', '$2a$12$iTOeSm.NoT8jH6wKIfmrKulOeA90vmz58bmDeBQTdz7eDk2CRZDna', '0912111222', 1, 'CUSTOMER');
INSERT INTO customers (user_id) VALUES (4);

-- User 5: Customer B (Sẽ có 3 xe)
INSERT INTO users (name, email, password, phone, status, user_type)
VALUES ('Tran Thi Binh', 'binh.tran@yahoo.com', '$2a$12$iTOeSm.NoT8jH6wKIfmrKulOeA90vmz58bmDeBQTdz7eDk2CRZDna', '0988777666', 1, 'CUSTOMER');
INSERT INTO customers (user_id) VALUES (5);

INSERT INTO users (name, email, password, phone, status, user_type) VALUES
('Nguyễn Văn A', 'a@email.com', '$2a$12$iTOeSm.NoT8jH6wKIfmrKulOeA90vmz58bmDeBQTdz7eDk2CRZDna', '0901234567', 1, 'Customer'),
('Trần Thị B', 'b@email.com', '$2a$12$iTOeSm.NoT8jH6wKIfmrKulOeA90vmz58bmDeBQTdz7eDk2CRZDna', '0909876543', 1, 'Customer');
INSERT INTO customers (user_id) VALUES (6), (7);

-- 3.2 LOCATIONS (5 dòng)
INSERT INTO locations (latitude, longitude, province, address_detail) VALUES
(10.7769, 106.7009, 'Hồ Chí Minh', '72 Lê Thánh Tôn, Bến Nghé, Quận 1'), -- Vincom Center
(21.0285, 105.8542, 'Hà Nội', '54A Nguyễn Chí Thanh, Láng Thượng, Đống Đa'), -- Vincom NCT
(16.0544, 108.2022, 'Đà Nẵng', '910A Ngô Quyền, An Hải Bắc, Sơn Trà'), -- Vincom Plaza
(10.7626, 106.6602, 'Hồ Chí Minh', '273 An Dương Vương, Phường 3, Quận 5'), -- ĐH Sư Phạm
(10.8231, 106.6297, 'Hồ Chí Minh', '10 Tân Kỳ Tân Quý, Tân Sơn Nhì, Tân Phú'); -- Aeon Mall

-- 3.3 RESCUE STATIONS (5 dòng)
INSERT INTO rescue_stations (location_id, name, phone, email, open_time, close_time) VALUES
(1, 'Cứu hộ Sài Gòn 247', '0901234567', 'sos@saigonrescue.com', '00:00:00', '23:59:59'),
(2, 'Gara Auto Cứu Hộ Hà Nội', '0987654321', 'hn_rescue@gmail.com', '07:00:00', '22:00:00'),
(3, 'Đội Cứu Hộ Sông Hàn', '0913555777', 'songhan_sos@danang.gov.vn', '00:00:00', '23:59:59'),
(4, 'Trạm Sửa Chữa Lưu Động Q5', '0933888999', 'suachuaq5@yahoo.com', '08:00:00', '18:00:00'),
(5, 'Aeon Rescue Point', '0283333444', 'help@aeon.com.vn', '09:00:00', '22:00:00');

-- 3.4 STATIONS (5 dòng - 3 của Vendor A, 2 của Vendor B)
-- Vendor 2 (VinCharge) owns 3 stations
INSERT INTO stations (vendor_id, location_id, name, open_time, close_time, status, type) VALUES
(2, 1, 'VinCharge Center Q1', '06:00:00', '23:00:00', 1, 'CAR'),
(2, 2, 'VinCharge NCT Hanoi', '00:00:00', '23:59:59', 1, 'CAR'),
(2, 3, 'VinCharge Da Nang', '07:00:00', '22:00:00', 0, 'MOTORBIKE');

-- Vendor 3 (E-Point) owns 2 stations
INSERT INTO stations (vendor_id, location_id, name, open_time, close_time, status, type) VALUES
(3, 4, 'E-Point University Hub', '05:00:00', '21:00:00', 1, 'MOTORBIKE'),
(3, 5, 'E-Point Mall Station', '09:00:00', '22:00:00', 1, 'BICYCLE');

-- 3.5 CHARGING POLES (5 dòng)
INSERT INTO charging_poles (station_id, manufacturer, max_power, connector_count, install_date) VALUES
(1, 'ABB', 150.00, 2, '2023-01-15'), -- Pole 1 at Station 1
(1, 'Siemens', 60.00, 1, '2023-02-20'), -- Pole 2 at Station 1
(2, 'Star Charge', 120.00, 2, '2023-03-10'), -- Pole 3 at Station 2
(4, 'Schneider', 11.00, 4, '2023-05-05'), -- Pole 4 at Station 4 (Motorbike)
(5, 'Bosch', 3.50, 10, '2023-06-01'); -- Pole 5 at Station 5 (Bicycle)

-- 3.6 CHARGING CONNECTORS (8 dòng - bao phủ ConnectorType & Status)
INSERT INTO charging_connectors (pole_id, connector_type, max_power, status) VALUES
(1, 'CCS', 150.00, 'AVAILABLE'),        -- Pole 1
(1, 'CHADEMO', 50.00, 'INUSE'),         -- Pole 1
(2, 'TYPE2', 22.00, 'AVAILABLE'),       -- Pole 2
(3, 'TESLA', 120.00, 'OUTOFSERVICE'),   -- Pole 3
(3, 'CCS', 100.00, 'AVAILABLE'),        -- Pole 3
(4, 'TYPE1', 3.50, 'AVAILABLE'),        -- Pole 4 (Motorbike)
(4, 'TYPE1', 3.50, 'INUSE'),            -- Pole 4
(5, 'TYPE2', 2.00, 'AVAILABLE');        -- Pole 5 (Bicycle)

-- 3.7 PRICES (5 dòng - Bao phủ PriceName)
INSERT INTO prices (charging_pole_id, name, price, effective_from, effective_to, start_time, end_time) VALUES
(1, 'CHARGING', 3500.00, '2023-01-01', NULL, '00:00:00', '23:59:59'), -- Giá sạc thường
(1, 'PENALTY', 50000.00, '2023-01-01', NULL, '00:00:00', '23:59:59'), -- Phí phạt chiếm chỗ
(3, 'CHARGING', 4000.00, '2023-06-01', '2023-12-31', '08:00:00', '18:00:00'), -- Giá giờ cao điểm
(3, 'CHARGING', 2500.00, '2023-06-01', '2023-12-31', '18:01:00', '07:59:00'), -- Giá giờ thấp điểm
(4, 'CHARGING', 1500.00, '2023-01-01', NULL, '00:00:00', '23:59:59');

-- 3.8 ELECTRIC VEHICLES (5 dòng - 2 của Cust A, 3 của Cust B)
-- Customer A (ID 4): 2 xe
INSERT INTO electric_vehicles (customer_id, vehicle_type, brand, model, license_plate, battery_capacity, connector_type) VALUES
(4, 'CAR', 'VinFast', 'VF8', '51K-123.45', 87.70, 'CCS'),
(4, 'MOTORBIKE', 'VinFast', 'Klara S', '59-M1 999.99', 3.50, 'TYPE1'),
(6, 'CAR', 'VinFast', 'VF8', '30A-12345', 82.0, 'CCS'),
(7, 'CAR', 'VinFast', 'VFe34', '59B-67890', 42.0, 'CCS');

-- Customer B (ID 5): 3 xe
INSERT INTO electric_vehicles (customer_id, vehicle_type, brand, model, license_plate, battery_capacity, connector_type) VALUES
(5, 'CAR', 'Tesla', 'Model 3', '30H-567.89', 75.00, 'TESLA'),
(5, 'CAR', 'Hyundai', 'Ioniq 5', '30H-111.22', 72.60, 'CCS'),
(5, 'BICYCLE', 'Dat Bike', 'Weaver++', '29-B1 555.55', 5.00, 'TYPE2');

-- 3.9 CHARGING SESSIONS (5 dòng - Bao phủ SessionStatus)
INSERT INTO charging_sessions (electric_vehicle_id, charging_connector_id, start_time, end_time, energy_kwh, cost, status) VALUES
(1, 1, '2023-10-01 08:00:00', '2023-10-01 09:00:00', 45.5, 159250.00, 'COMPLETED'), -- Xe 1 sạc xong
(2, 6, '2023-10-02 10:00:00', NULL, 1.2, 5000.00, 'CHARGING'),               -- Xe 2 đang sạc
(3, 4, '2023-10-03 14:00:00', '2023-10-03 14:05:00', 0.1, 0.00, 'FAILED'),      -- Xe 3 lỗi
(4, 5, '2023-10-04 15:00:00', NULL, NULL, NULL, 'PENDING'),                     -- Xe 4 đặt trước
(5, 8, '2023-10-05 09:00:00', '2023-10-05 09:10:00', 0.5, 0.00, 'CANCELLED'),   -- Xe 5 hủy
(6, 8, '2023-10-05 09:00:00', '2023-10-05 09:10:00', 0.5, 0.00, 'CANCELLED'),   
(6, 6, '2023-10-06 11:00:00', '2023-10-06 12:30:00', 30.0, 120000.00, 'COMPLETED'),
(6, 7, '2023-10-07 13:00:00', NULL, NULL, NULL, 'CHARGING'),
(7, 7, '2023-09-15 08:00:00', '2023-09-15 09:00:00', 40.0, 140000.00, 'COMPLETED'),
(6, 6, '2023-09-20 10:00:00', '2023-09-20 11:30:00', 35.0, 130000.00, 'COMPLETED'),
(7, 7, '2023-09-25 14:00:00', '2023-09-25 14:05:00', 0.1, 0.00, 'COMPLETED'),
(6, 8, '2023-10-05 09:00:00', '2023-10-05 09:10:00', 0.5, 0.00, 'COMPLETED'),   
(7, 8, '2023-10-05 09:00:00', '2023-10-05 09:10:00', 0.5, 0.00, 'COMPLETED'),   
(6, 8, '2023-10-05 09:00:00', '2023-10-05 09:10:00', 0.5, 0.00, 'COMPLETED'),   
(6, 8, '2023-10-05 09:00:00', '2023-10-05 09:10:00', 0.5, 0.00, 'COMPLETED');   

-- 3.10 TRANSACTIONS 
INSERT INTO transactions (charging_session_id, customer_id, amount, payment_method, payment_status, bank_name, account_number, payment_time) VALUES
-- --- GROUP 1: CÁCH ĐÂY 1 NĂM (YEARLY) ---
-- Session 1: Thành công ngay
(6, 6, 150000.00, 'CREDITCARD', 'PAID', 'Vietcombank', '****1234', NOW() - INTERVAL '1 year'),

-- Session 2: Fail 1 lần, sau đó Success
(7, 6, 220000.00, 'EWALLET', 'FAILED', 'Momo', '0901234567', NOW() - INTERVAL '1 year' + INTERVAL '1 hour'),
(7, 6, 220000.00, 'BANKTRASFER', 'PAID', 'Techcombank', '190333444', NOW() - INTERVAL '1 year' + INTERVAL '1 hour 5 minutes'),

-- Session 3: Thành công
(8, 7, 55000.00, 'CASH', 'PAID', 'VNPAY', NULL, NOW() - INTERVAL '11 months'),


-- --- GROUP 2: CÁCH ĐÂY 3 THÁNG (QUARTERLY) ---
-- Session 4: Thành công
(9, 7, 300000.00, 'CREDITCARD', 'PAID', 'TPBank', '****5678', NOW() - INTERVAL '3 months'),

-- Session 5: Fail 2 lần (do lỗi mạng/số dư), sau đó Success
(10, 6, 180000.00, 'EWALLET', 'FAILED', 'ZaloPay', '0901234567', NOW() - INTERVAL '3 months' + INTERVAL '2 days'),
(10, 6, 180000.00, 'EWALLET', 'FAILED', 'ZaloPay', '0901234567', NOW() - INTERVAL '3 months' + INTERVAL '2 days 1 minute'),
(10, 6, 180000.00, 'CREDITCARD', 'PAID', 'MBBank', '****9999', NOW() - INTERVAL '3 months' + INTERVAL '2 days 5 minutes'),


-- --- GROUP 3: CÁCH ĐÂY 30 NGÀY (MONTHLY) ---
-- Session 6: Thành công
(11, 7, 95000.00, 'BANKTRASFER', 'PAID', 'ACB', '88889999', NOW() - INTERVAL '25 days'),

-- Session 7: Fail 1 lần, Success 1 lần
(12, 6, 450000.00, 'CREDITCARD', 'FAILED', 'Vietinbank', '****0000', NOW() - INTERVAL '20 days'),
(12, 6, 450000.00, 'CREDITCARD', 'PAID', 'Vietinbank', '****0000', NOW() - INTERVAL '20 days' + INTERVAL '2 minutes'),


-- --- GROUP 4: TRONG 7 NGÀY QUA (WEEKLY) ---
-- Session 8: Thành công (Cách đây 5 ngày)
(13, 7, 120000.00, 'EWALLET', 'PAID', 'ShopeePay', '0909876543', NOW() - INTERVAL '5 days'),

-- Session 9: Thành công (Hôm qua)
(14, 6, 200000.00, 'CASH', 'PAID', 'VNPAY', NULL, NOW() - INTERVAL '1 day'),

-- Session 10: Thành công (Hôm nay - Vừa xong)
(15, 6, 75000.00, 'EWALLET', 'PAID', 'Momo', '0901234567', NOW() - INTERVAL '30 minutes');

DO $$
DECLARE
    -- Cấu hình số lượng
    _total_groups INTEGER := 4; 
    _tx_per_group INTEGER := 10; -- 10 cái mỗi nhóm thời gian
    
    -- Biến tạm
    _i INTEGER;
    _j INTEGER;
    _customer_id INTEGER;
    _vehicle_id INTEGER;
    _connector_id INTEGER;
    _session_id INTEGER;
    _time_offset INTERVAL;
    _base_time TIMESTAMP;
    _amount DECIMAL(15,2);
    _status VARCHAR;
    
    -- Danh sách connector của Vendor 3 (ID 6, 7, 8 dựa trên dữ liệu mẫu)
    _vendor3_connectors INTEGER[] := ARRAY[6, 7, 8]; 
BEGIN
    -- Vòng lặp qua 4 nhóm thời gian
    -- 1: 0-7 ngày | 2: 8-30 ngày | 3: 31-90 ngày | 4: 91-365 ngày
    FOR _i IN 1.._total_groups LOOP
        
        FOR _j IN 1.._tx_per_group LOOP
            
            -- 1. TÍNH TOÁN THỜI GIAN (Random trong khoảng)
            IF _i = 1 THEN
                -- 0 đến 7 ngày
                _time_offset := (floor(random() * 7) || ' days')::interval + (floor(random() * 24) || ' hours')::interval;
            ELSIF _i = 2 THEN
                -- 8 đến 30 ngày
                _time_offset := (8 + floor(random() * 22) || ' days')::interval;
            ELSIF _i = 3 THEN
                -- 31 đến 90 ngày (3 tháng)
                _time_offset := (31 + floor(random() * 59) || ' days')::interval;
            ELSE
                -- 91 đến 365 ngày (1 năm)
                _time_offset := (91 + floor(random() * 274) || ' days')::interval;
            END IF;

            _base_time := NOW() - _time_offset;

            -- 2. CHỌN NGẪU NHIÊN DỮ LIỆU
            -- Chọn random Customer (4, 5, 6, 7)
            _customer_id := 4 + floor(random() * 4); 
            
            -- Chọn xe tương ứng (đơn giản hóa: chọn xe bất kỳ từ 1-7)
            _vehicle_id := 1 + floor(random() * 7);
            
            -- Chọn Connector CHỈ CỦA VENDOR 3
            _connector_id := _vendor3_connectors[1 + floor(random() * array_length(_vendor3_connectors, 1))];
            
            -- Random tiền
            _amount := (50 + floor(random() * 450)) * 1000; -- 50k đến 500k

            -- 3. TẠO SESSION
            INSERT INTO charging_sessions (electric_vehicle_id, charging_connector_id, start_time, end_time, energy_kwh, cost, status)
            VALUES (
                _vehicle_id, 
                _connector_id, 
                _base_time, 
                _base_time + INTERVAL '45 minutes', 
                15.5 + (random() * 30), -- kwh
                _amount, 
                'COMPLETED'
            ) RETURNING id INTO _session_id;

            -- 4. TẠO TRANSACTION (Xử lý Fail trước nếu trúng vé số)
            -- Cứ mỗi 5 giao dịch (index chia hết cho 5) thì tạo 1 cái Fail trước
            IF _j % 5 = 0 THEN
                INSERT INTO transactions (charging_session_id, customer_id, amount, payment_method, payment_status, bank_name, payment_time)
                VALUES (
                    _session_id,
                    _customer_id,
                    _amount,
                    'EWALLET',
                    'FAILED', -- Giao dịch lỗi
                    'BANKTRASFER',
                    _base_time + INTERVAL '46 minutes'
                );
            END IF;

            -- Tạo giao dịch thành công (Luôn có)
            INSERT INTO transactions (charging_session_id, customer_id, amount, payment_method, payment_status, bank_name, account_number, payment_time)
            VALUES (
                _session_id,
                _customer_id,
                _amount,
                CASE WHEN random() > 0.5 THEN 'CREDITCARD' ELSE 'CASH' END,
                'PAID', -- Giao dịch thành công
                CASE WHEN random() > 0.5 THEN 'Vietcombank' ELSE 'VNPAY' END,
                '****' || floor(random() * 9000 + 1000),
                _base_time + INTERVAL '48 minutes' -- Thanh toán sau khi sạc xong 3p
            );

        END LOOP;
    END LOOP;
END $$;

-- 3.11 RATINGS (5 dòng - Bao phủ TargetType)
-- Cust 4 rate Station
INSERT INTO ratings (customer_id, target_type, target_id, stars, comment, created_at) VALUES
(4, 'STATION', 1, 5, 'Trạm sạc rất nhanh và tiện lợi ngay trung tâm.', '2023-10-01 10:00:00');

-- Cust 4 rate Vendor
INSERT INTO ratings (customer_id, target_type, target_id, stars, comment, created_at) VALUES
(4, 'VENDOR', 2, 4, 'Dịch vụ của VinCharge khá tốt, nhưng app thỉnh thoảng lag.', '2023-10-02 09:00:00');

-- Cust 5 rate RescueStation
INSERT INTO ratings (customer_id, target_type, target_id, stars, comment, created_at) VALUES
(5, 'RESCUESTATION', 2, 5, 'Đến rất nhanh, thợ nhiệt tình.', '2023-10-03 16:00:00');

-- Cust 5 rate Station (khác)
INSERT INTO ratings (customer_id, target_type, target_id, stars, comment, created_at) VALUES
(5, 'STATION', 4, 3, 'Trạm xe máy hơi chật chội vào giờ cao điểm.', '2023-10-05 12:00:00');

-- Cust 5 rate Vendor (khác)
INSERT INTO ratings (customer_id, target_type, target_id, stars, comment, created_at) VALUES
(5, 'VENDOR', 3, 4, 'Giá cả hợp lý cho sinh viên.', '2023-10-06 14:00:00');
