-- ============================================================
-- 代表测试数据 (Representative Test Data)
-- 数据库: bookingdb
-- 覆盖正常值、边界值、异常值场景
-- ============================================================

USE bookingdb;

-- ----------------------------------------------------------
-- 1. 专家测试数据
-- ----------------------------------------------------------

-- 正常数据：三个不同等级的在职专家
INSERT INTO specialists (name, expertise, level, fee, status, contact, description) VALUES
('Dr. Zhang Wei', 'Academic Support', 'Senior', 80.00, 1, 'zhang@abc.com', '10+ years of academic counseling experience'),
('Dr. Li Ming', 'Career Planning', 'Intermediate', 50.00, 1, 'li@abc.com', 'Career coach for university students'),
('Dr. Wang Fang', 'Anxiety Management', 'Junior', 30.00, 1, 'wang@abc.com', 'Trained in CBT for anxiety relief');

-- 边界数据：状态不可用的专家 (status=0)
INSERT INTO specialists (name, expertise, level, fee, status, contact, description) VALUES
('Dr. Chen Xiao', 'Academic Support', 'Senior', 80.00, 0, 'chen@abc.com', 'Currently unavailable'),
('Dr. Liu Yang', 'Time Management', 'Intermediate', 50.00, 0, 'liu@abc.com', 'On leave');

-- ----------------------------------------------------------
-- 2. 时间段测试数据
-- ----------------------------------------------------------

-- 正常数据：未来一周的可用时段
INSERT INTO time_slots (specialist_id, start_time, end_time, is_available, version) VALUES
(1, '2026-05-10 09:00:00', '2026-05-10 10:00:00', 1, 0),
(1, '2026-05-10 10:00:00', '2026-05-10 11:00:00', 1, 0),
(1, '2026-05-11 14:00:00', '2026-05-11 15:00:00', 1, 0),
(2, '2026-05-10 09:00:00', '2026-05-10 10:00:00', 1, 0),
(2, '2026-05-12 10:00:00', '2026-05-12 11:00:00', 1, 0),
(3, '2026-05-10 15:00:00', '2026-05-10 16:00:00', 1, 0);

-- 边界数据：已过去的时间段（不可用状态，模拟历史数据）
INSERT INTO time_slots (specialist_id, start_time, end_time, is_available, version) VALUES
(1, '2026-05-01 09:00:00', '2026-05-01 10:00:00', 0, 0),
(2, '2026-05-01 14:00:00', '2026-05-01 15:00:00', 0, 0);

-- ----------------------------------------------------------
-- 3. 用户测试数据 (可选)
-- 如果还没有测试账号，可以用注册接口；这里也可直接插入一个管理员用户方便测试
-- 密码为 BCrypt 加密后的 "123456" (请根据实际 BCrypt 强度调整)
-- ----------------------------------------------------------
-- INSERT INTO users (username, email, password_hash, role, phone, avatar, failed_attempts, locked_until) VALUES
-- ('Admin', 'admin@example.com', '$2a$10$xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', 'ADMIN', '', '', 0, NULL);
