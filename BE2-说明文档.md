# BE2 核心预约模块 - 说明文档

## 一、分支信息

| 项目 | 内容 |
|------|------|
| **分支名称** | `feature/be2-booking-workflow` |
| **提交记录** | `4c45471` - feat(booking): implement core booking workflow module (BE2) |
| **远程地址** | https://github.com/CPT202-Group29/Booking-System/tree/feature/be2-booking-workflow |

## 二、代码结构

```
backend/
├── pom.xml                                          # Maven 构建配置
├── src/main/java/com/bookingsystem/
│   ├── BookingSystemApplication.java                 # Spring Boot 启动入口
│   ├── model/
│   │   ├── BookingStatus.java                        # 预约状态枚举
│   │   ├── Booking.java                              # 预约实体类
│   │   └── TimeSlot.java                             # 时间段实体类
│   ├── dto/
│   │   ├── BookingRequest.java                       # 创建预约请求
│   │   ├── BookingResponse.java                      # 预约响应
│   │   ├── CancelRequest.java                        # 取消预约请求
│   │   ├── RescheduleRequest.java                    # 改期预约请求
│   │   └── BookingActionRequest.java                 # 确认/完成操作请求
│   ├── repository/
│   │   ├── BookingRepository.java                    # 预约数据访问层
│   │   └── TimeSlotRepository.java                   # 时间段数据访问层
│   ├── service/
│   │   ├── BookingService.java                       # 核心预约业务逻辑
│   │   └── ChargeCalculationService.java             # 费用计算服务
│   ├── controller/
│   │   └── BookingController.java                    # REST API 控制器
│   └── exception/
│       ├── BookingException.java                     # 自定义业务异常
│       └── GlobalExceptionHandler.java               # 全局异常处理器
├── src/main/resources/
│   ├── application.yml                               # 应用配置
│   └── db/schema.sql                                 # 数据库建表脚本
└── src/test/java/com/bookingsystem/
    └── BookingServiceTest.java                       # 集成测试
```

## 三、API 接口说明

### 基础路径: `/api/v1`

| 方法 | 路径 | 功能 | 业务规则 |
|------|------|------|----------|
| **POST** | `/bookings` | 创建预约 | 需指定客户、专家、时间段、主题；自动检测冲突 |
| **GET** | `/bookings/{id}` | 查询预约详情 | - |
| **GET** | `/bookings?customerId=X` | 查客户的所有预约 | - |
| **GET** | `/bookings?specialistId=X` | 查专家的所有预约 | - |
| **PUT** | `/bookings/{id}/confirm` | 管理员确认预约 | 仅 PENDING 状态可确认 |
| **PUT** | `/bookings/{id}/complete` | 专家标记完成 | 仅 CONFIRMED 状态可完成 |
| **POST** | `/bookings/{id}/cancel` | 客户取消预约 | 需在预约开始前 24 小时以上 |
| **POST** | `/bookings/{id}/reschedule` | 客户改期 | 需 24 小时以上，自动释放原时段 |
| **GET** | `/slots?specialistId=X&from=...&to=...` | 查询可用时段 | - |
| **GET** | `/health` | 健康检查 | - |

### 预约状态流转

```
PENDING (待确认) ──→ CONFIRMED (已确认) ──→ COMPLETED (已完成)
      │                      │
      └──→ CANCELLED (已取消) ┘
```

## 四、并发控制方案

| 场景 | 技术 | 说明 |
|------|------|------|
| **防止重复预订** | 悲观锁 `SELECT FOR UPDATE` | 创建预约时锁定时间段，确保同一时段不会被两个事务同时预订 |
| **状态变更安全** | 悲观锁 `SELECT FOR UPDATE` | 取消/改期/确认时锁定预约记录，防止冲突的状态变更 |
| **时段释放安全** | 乐观锁 `@Version` | TimeSlot 表含 version 字段，更新时自动检测并发冲突 |

## 五、数据库配置

### 本地开发（H2 内存数据库，无需安装）
默认配置，开箱即用：`http://localhost:8080/h2-console`

### 阿里云数据库（MySQL）
```bash
# 启动时指定 MySQL profile
java -jar target/booking-system-backend-1.0.0.jar --spring.profiles.active=mysql

# 或设置环境变量
set SPRING_PROFILES_ACTIVE=mysql
mvn spring-boot:run
```

连接信息：
- 地址：`47.111.224.168:3306`
- 库名：`expert_system`
- 用户名：`expert`
- 密码：`123456Abc`

## 六、本地运行步骤

```bash
# 1. 进入项目目录
cd D:\year3\CPT202\expert_booking_system\backend

# 2. 编译并运行测试
mvn clean test

# 3. 启动服务（默认 H2 内存数据库）
mvn spring-boot:run

# 4. 访问
# API: http://localhost:8080/api/v1/health
# H2控制台: http://localhost:8080/h2-console
```

## 七、提交规范

- 功能开发：`feature/xxx`
- 问题修复：`bugfix/xxx`
- 实验性代码：`test/xxx`
- 提交格式：`type(scope): description`

## 八、注意事项

1. 本模块**仅包含 BE2 的后端代码**，不涉及前端
2. `application.yml` 中默认使用 H2 内存数据库，切换到 MySQL 需使用 `--spring.profiles.active=mysql`
3. 时间段的创建和管理由其他模块负责，本模块只负责预约流程
4. 用户认证和权限校验由 BE1 负责，本模块通过 API 参数接收用户 ID
