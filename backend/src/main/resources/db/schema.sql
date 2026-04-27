-- ============================================================
-- Booking System - Database Schema
-- BE2 Module: Core Booking Tables
-- Compatible: MySQL 8.0+ and H2
-- ============================================================

-- Time slots table (managed by specialists/admin)
CREATE TABLE IF NOT EXISTS time_slots (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    specialist_id BIGINT NOT NULL,
    start_time DATETIME NOT NULL,
    end_time DATETIME NOT NULL,
    is_available BOOLEAN NOT NULL DEFAULT TRUE,
    version INT NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_slot_specialist (specialist_id),
    INDEX idx_slot_availability (is_available),

    CONSTRAINT chk_slot_time CHECK (end_time > start_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Bookings table (core business entity)
CREATE TABLE IF NOT EXISTS bookings (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    customer_id BIGINT NOT NULL,
    specialist_id BIGINT NOT NULL,
    time_slot_id BIGINT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    topic VARCHAR(200),
    notes VARCHAR(500),
    charge_amount DECIMAL(10, 2),
    cancel_reason VARCHAR(300),
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_booking_customer (customer_id),
    INDEX idx_booking_specialist (specialist_id),
    INDEX idx_booking_status (status),
    INDEX idx_booking_slot (time_slot_id),

    CONSTRAINT chk_booking_status
        CHECK (status IN ('PENDING','CONFIRMED','CANCELLED','COMPLETED')),
    CONSTRAINT chk_charge_positive
        CHECK (charge_amount IS NULL OR charge_amount >= 0),

    FOREIGN KEY (time_slot_id) REFERENCES time_slots(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
