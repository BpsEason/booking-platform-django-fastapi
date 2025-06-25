-- docs/database_schema.sql

-- 1. users (使用者帳戶)
CREATE TABLE users (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    phone_number VARCHAR(20) UNIQUE,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    user_type ENUM('customer', 'merchant_admin', 'staff', 'super_admin') NOT NULL,
    status ENUM('active', 'inactive', 'suspended') NOT NULL DEFAULT 'active',
    last_login_at DATETIME,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_users_email (email),
    INDEX idx_users_phone_number (phone_number),
    INDEX idx_users_user_type (user_type)
);

-- 2. merchants (商家資訊)
CREATE TABLE merchants (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    owner_user_id BIGINT UNSIGNED NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    address VARCHAR(255),
    city VARCHAR(100),
    district VARCHAR(100),
    phone_number VARCHAR(20),
    email VARCHAR(255),
    website_url VARCHAR(255),
    business_hours_json JSON,
    status ENUM('active', 'inactive', 'pending_approval') NOT NULL DEFAULT 'pending_approval',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_merchants_name (name),
    INDEX idx_merchants_slug (slug),
    INDEX idx_merchants_status (status),
    INDEX idx_merchants_city_district (city, district)
);

-- 3. staffs (商家員工 / 提供服務者)
CREATE TABLE staffs (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    merchant_id BIGINT UNSIGNED NOT NULL,
    user_id BIGINT UNSIGNED UNIQUE, -- NULL if staff doesn't need system login
    display_name VARCHAR(255) NOT NULL,
    real_name VARCHAR(255),
    title VARCHAR(100),
    description TEXT,
    profile_picture_url VARCHAR(255),
    status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (merchant_id) REFERENCES merchants(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_staffs_merchant_id (merchant_id),
    INDEX idx_staffs_status (status)
);

-- 4. services (商家提供的服務項目)
CREATE TABLE services (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    merchant_id BIGINT UNSIGNED NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    duration_minutes SMALLINT UNSIGNED NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    requires_staff_selection BOOLEAN NOT NULL DEFAULT FALSE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (merchant_id) REFERENCES merchants(id) ON DELETE CASCADE,
    INDEX idx_services_merchant_id (merchant_id),
    INDEX idx_services_is_active (is_active)
);

-- 5. service_staff_assignments (服務與員工的關聯)
CREATE TABLE service_staff_assignments (
    service_id BIGINT UNSIGNED NOT NULL,
    staff_id BIGINT UNSIGNED NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (service_id, staff_id),
    FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE,
    FOREIGN KEY (staff_id) REFERENCES staffs(id) ON DELETE CASCADE
);

-- 6. staff_schedules (員工排班表)
CREATE TABLE staff_schedules (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    staff_id BIGINT UNSIGNED NOT NULL,
    schedule_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    type ENUM('working', 'break', 'special_leave') NOT NULL DEFAULT 'working',
    notes VARCHAR(255),
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (staff_id) REFERENCES staffs(id) ON DELETE CASCADE,
    UNIQUE KEY uq_staff_schedule (staff_id, schedule_date, start_time, end_time), -- Prevent overlapping/duplicate schedule entries
    INDEX idx_staff_schedules_date (schedule_date)
);

-- 7. appointments (預約記錄)
CREATE TABLE appointments (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    merchant_id BIGINT UNSIGNED NOT NULL,
    service_id BIGINT UNSIGNED NOT NULL,
    staff_id BIGINT UNSIGNED,
    appointment_datetime_start DATETIME NOT NULL,
    appointment_datetime_end DATETIME NOT NULL,
    status ENUM('pending', 'confirmed', 'cancelled_by_customer', 'cancelled_by_merchant', 'completed', 'no_show') NOT NULL DEFAULT 'pending',
    total_price DECIMAL(10, 2) NOT NULL,
    payment_status ENUM('unpaid', 'paid', 'refunded', 'partially_refunded') NOT NULL DEFAULT 'unpaid',
    notes_customer TEXT,
    notes_merchant TEXT,
    cancellation_reason VARCHAR(255),
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (merchant_id) REFERENCES merchants(id) ON DELETE CASCADE,
    FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE,
    FOREIGN KEY (staff_id) REFERENCES staffs(id) ON DELETE SET NULL,
    INDEX idx_appointments_user_id (user_id),
    INDEX idx_appointments_merchant_id (merchant_id),
    INDEX idx_appointments_staff_id (staff_id),
    INDEX idx_appointments_start_time (appointment_datetime_start),
    INDEX idx_appointments_status (status)
);

-- 8. payment_transactions (金流交易記錄)
CREATE TABLE payment_transactions (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    appointment_id BIGINT UNSIGNED NOT NULL UNIQUE,
    transaction_id_gateway VARCHAR(255) NOT NULL UNIQUE,
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'TWD',
    payment_method ENUM('credit_card', 'line_pay', 'apple_pay', 'cash'),
    status ENUM('pending', 'success', 'failed', 'refunded') NOT NULL,
    gateway_response JSON,
    transacted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE,
    INDEX idx_payments_status (status)
);

-- 9. recommendation_events (推薦事件日誌)
CREATE TABLE recommendation_events (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED, -- NULL for anonymous users
    session_id VARCHAR(255), -- For anonymous user tracking
    event_type ENUM('impression', 'click', 'book') NOT NULL,
    recommended_item_type ENUM('service', 'merchant', 'staff') NOT NULL,
    recommended_item_id BIGINT UNSIGNED,
    recommendation_strategy_version VARCHAR(50),
    context_json JSON,
    event_timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_rec_events_user_id (user_id),
    INDEX idx_rec_events_type_item (event_type, recommended_item_type),
    INDEX idx_rec_events_strategy (recommendation_strategy_version),
    INDEX idx_rec_events_timestamp (event_timestamp)
);

-- 10. settings_merchant (商家配置設定)
CREATE TABLE settings_merchant (
    merchant_id BIGINT UNSIGNED NOT NULL,
    `key` VARCHAR(255) NOT NULL,
    `value` TEXT,
    value_type ENUM('string', 'boolean', 'integer', 'json') NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (merchant_id, `key`),
    FOREIGN KEY (merchant_id) REFERENCES merchants(id) ON DELETE CASCADE
);
