#!/bin/bash
BASE="http://localhost:8080"

echo "========================================="
echo "  集成测试 - Specialist Booking System"
echo "========================================="

# ========== 1. 注册测试 ==========
echo ""
echo "--- 1.1 注册正常用户 ---"
REG1=$(curl -s -X POST "$BASE/api/auth/register" -H "Content-Type: application/json" -d '{"name":"Alice","email":"alice@test.com","password":"abc123456"}')
echo "$REG1"
TOKEN_A=$(echo "$REG1" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

echo ""
echo "--- 1.2 注册重复邮箱 (预期 400) ---"
curl -s -X POST "$BASE/api/auth/register" -H "Content-Type: application/json" -d '{"name":"Alice2","email":"alice@test.com","password":"123456"}'

echo ""
echo "--- 1.3 注册缺少密码 (预期 400) ---"
curl -s -X POST "$BASE/api/auth/register" -H "Content-Type: application/json" -d '{"name":"Bob","email":"bob@test.com"}'

# ========== 2. 登录测试 ==========
echo ""
echo "--- 2.1 正常登录 ---"
LOGIN=$(curl -s -X POST "$BASE/api/auth/login" -H "Content-Type: application/json" -d '{"email":"alice@test.com","password":"abc123456"}')
echo "$LOGIN"

echo ""
echo "--- 2.2 错误密码 (预期 400) ---"
curl -s -X POST "$BASE/api/auth/login" -H "Content-Type: application/json" -d '{"email":"alice@test.com","password":"wrong"}'

echo ""
echo "--- 2.3 不存在用户 (预期 400) ---"
curl -s -X POST "$BASE/api/auth/login" -H "Content-Type: application/json" -d '{"email":"nobody@test.com","password":"123456"}'

# ========== 3. Profile 测试 ==========
echo ""
echo "--- 3.1 查看个人信息 ---"
curl -s "$BASE/api/users/me" -H "Authorization: Bearer $TOKEN_A"

echo ""
echo "--- 3.2 更新个人信息 ---"
curl -s -X PUT "$BASE/api/users/me" -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN_A" -d '{"name":"Alice Wang","phone":"1234567890"}'

# ========== 4. 专家管理测试 ==========
echo ""
echo "--- 4.1 专家列表 ---"
curl -s "$BASE/api/v1/specialists?size=999"

echo ""
echo "--- 4.2 创建专家 (需要管理员权限，用之前提升过的账号) ---"

echo ""
echo "--- 4.3 获取专家费用 ---"
curl -s "$BASE/api/v1/specialists/1/fee"

# ========== 5. 时间段测试 ==========
echo ""
echo "--- 5.1 创建时间段 (使用专家1) ---"
curl -s -X POST "$BASE/api/v1/slots" -H "Content-Type: application/json" -d '{"specialistId":1,"startTime":"2026-12-31T09:00:00","endTime":"2026-12-31T10:00:00"}'

echo ""
echo "--- 5.2 创建重叠时间段 (预期 409 冲突) ---"
curl -s -X POST "$BASE/api/v1/slots" -H "Content-Type: application/json" -d '{"specialistId":1,"startTime":"2026-12-31T09:30:00","endTime":"2026-12-31T10:30:00"}'

echo ""
echo "--- 5.3 创建非法时间段 (结束早于开始，预期 400) ---"
curl -s -X POST "$BASE/api/v1/slots" -H "Content-Type: application/json" -d '{"specialistId":1,"startTime":"2026-12-31T10:00:00","endTime":"2026-12-31T09:00:00"}'

# ========== 6. 预约测试 ==========
echo ""
echo "--- 6.1 正常创建预约 ---"
BOOK=$(curl -s -X POST "$BASE/api/v1/bookings" -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN_A" -d '{"customerId":1,"specialistId":1,"timeSlotId":1,"topic":"Career Advice"}')
echo "$BOOK"
BOOKING_ID=$(echo "$BOOK" | grep -o '"id":\d*' | head -1 | cut -d':' -f2)

echo ""
echo "--- 6.2 重复预订同一槽位 (预期 409) ---"
curl -s -X POST "$BASE/api/v1/bookings" -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN_A" -d '{"customerId":1,"specialistId":1,"timeSlotId":1,"topic":"Another Topic"}'

# ========== 7. 状态管理 ==========
echo ""
echo "--- 7.1 确认预约 ---"
curl -s -X PUT "$BASE/api/v1/bookings/$BOOKING_ID/confirm"

echo ""
echo "--- 7.2 取消预约 ---"
curl -s -X POST "$BASE/api/v1/bookings/$BOOKING_ID/cancel" -H "Content-Type: application/json" -d '{"customerId":1,"cancelReason":"Change of plan"}'

# ========== 8. 边界值测试 ==========
echo ""
echo "--- 8.1 分页参数 (page=0, size=1) ---"
curl -s "$BASE/api/v1/specialists?page=0&size=1"

echo ""
echo "--- 8.2 按名称搜索 (模糊匹配) ---"
curl -s "$BASE/api/v1/specialists?name=Zhang&size=999"

echo ""
echo "--- 8.3 健康检查 ---"
curl -s "$BASE/api/v1/health"

echo ""
echo "========================================="
echo "  集成测试完成"
echo "========================================="
