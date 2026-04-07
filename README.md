# Booking System 预约系统

## 项目简介
本项目为专家咨询预约系统后端服务，实现用户预约管理核心功能，包括取消预约与改期预约，并包含数据库事务控制、24小时取消限制、并发安全控制等业务规则。

## 技术栈
- Python + Flask
- MySQL
- 事务处理与并发控制
- Flask-CORS 支持前后端联调

## 环境配置
### 安装依赖
在终端执行：
pip install flask mysql-connector-python flask-cors

### 数据库配置
确保本地 MySQL 服务已启动，并创建数据库 booking_system。
连接信息：
host=localhost
user=root
password=123456
database=booking_system

## 运行项目
在终端执行：
python app.py

服务启动后运行在：http://127.0.0.1:5000

## API 接口说明
### 1. 取消预约
URL: /api/bookings/<booking_id>/cancel
请求方法: POST
请求体:
{
    "user_id": 1,
    "cancel_reason": "无法按时前往"
}
业务规则:
- 仅可取消自己的预约
- 需距离预约开始时间至少 24 小时
- 取消后自动释放对应的时间段

### 2. 改期预约
URL: /api/bookings/<booking_id>/reschedule
请求方法: POST
请求体:
{
    "user_id": 1,
    "new_slot_id": 5
}
业务规则:
- 仅可修改自己的预约
- 原预约需满足 24 小时改期限制
- 新时间段必须处于可用状态
- 使用数据库事务保证并发安全

## 文件结构
- app.py：主程序入口，包含所有核心 API 接口
- setup_db.py：数据库初始化与测试数据注入脚本
- create_tables.sql：建表 SQL 文件
- test_api.py / test_reschedule.py：接口功能与并发测试脚本
- middleware.py：后续扩展用的中间件/鉴权模块

## 作者
后端模块开发：yulinlin-77
