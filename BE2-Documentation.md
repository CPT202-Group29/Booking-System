# BE2 Core Booking Module - Documentation

## 1. Branch Information

| Item | Details |
|------|---------|
| **Branch Name** | `feature/be2-booking-workflow` |
| **Commit** | `4c45471` - feat(booking): implement core booking workflow module (BE2) |
| **Remote URL** | https://github.com/CPT202-Group29/Booking-System/tree/feature/be2-booking-workflow |

## 2. Project Structure

```
backend/
├── pom.xml                                          # Maven build configuration
├── src/main/java/com/bookingsystem/
│   ├── BookingSystemApplication.java                 # Spring Boot entry point
│   ├── model/
│   │   ├── BookingStatus.java                        # Booking status enum
│   │   ├── Booking.java                              # Booking entity
│   │   └── TimeSlot.java                             # Time slot entity
│   ├── dto/
│   │   ├── BookingRequest.java                       # Create booking request
│   │   ├── BookingResponse.java                      # Booking response
│   │   ├── CancelRequest.java                        # Cancel booking request
│   │   ├── RescheduleRequest.java                    # Reschedule request
│   │   └── BookingActionRequest.java                 # Confirm/Complete request
│   ├── repository/
│   │   ├── BookingRepository.java                    # Booking data access
│   │   └── TimeSlotRepository.java                   # Time slot data access
│   ├── service/
│   │   ├── BookingService.java                       # Core booking business logic
│   │   └── ChargeCalculationService.java             # Fee calculation service
│   ├── controller/
│   │   └── BookingController.java                    # REST API controller
│   └── exception/
│       ├── BookingException.java                     # Custom business exception
│       └── GlobalExceptionHandler.java               # Global exception handler
├── src/main/resources/
│   ├── application.yml                               # Application configuration
│   └── db/schema.sql                                 # Database schema script
└── src/test/java/com/bookingsystem/
    └── BookingServiceTest.java                       # Integration tests (13 cases)
```

## 3. API Endpoints

### Base Path: `/api/v1`

| Method | Path | Description | Business Rules |
|--------|------|-------------|----------------|
| **POST** | `/bookings` | Create a booking | Requires customer, specialist, time slot, topic; auto conflict detection |
| **GET** | `/bookings/{id}` | Get booking details | - |
| **GET** | `/bookings?customerId=X` | List customer bookings | - |
| **GET** | `/bookings?specialistId=X` | List specialist bookings | - |
| **PUT** | `/bookings/{id}/confirm` | Admin confirms booking | Only from PENDING state |
| **PUT** | `/bookings/{id}/complete` | Specialist marks complete | Only from CONFIRMED state |
| **POST** | `/bookings/{id}/cancel` | Customer cancels booking | Must be at least 24h before appointment |
| **POST** | `/bookings/{id}/reschedule` | Customer reschedules | 24h rule applies; old slot auto-released |
| **GET** | `/slots?specialistId=X&from=...&to=...` | Query available slots | - |
| **GET** | `/health` | Health check | - |

### Booking Status State Machine

```
PENDING ──→ CONFIRMED ──→ COMPLETED
   │              │
   └──→ CANCELLED ┘
```

### Example Requests

**Create a booking:**
```json
POST /api/v1/bookings
{
    "customerId": 100,
    "specialistId": 200,
    "timeSlotId": 1,
    "topic": "Database design consultation",
    "notes": "Need help with ERD"
}
```

**Cancel a booking:**
```json
POST /api/v1/bookings/1/cancel
{
    "customerId": 100,
    "cancelReason": "Schedule conflict"
}
```

**Reschedule a booking:**
```json
POST /api/v1/bookings/1/reschedule
{
    "customerId": 100,
    "newTimeSlotId": 5
}
```

## 4. Concurrency Control Strategy

| Scenario | Technique | Description |
|----------|-----------|-------------|
| **Double-booking prevention** | Pessimistic lock `SELECT FOR UPDATE` | Locks the time slot during booking creation, preventing two transactions from booking the same slot concurrently |
| **Status transition safety** | Pessimistic lock `SELECT FOR UPDATE` | Locks booking record during cancel/reschedule/confirm to prevent conflicting state changes |
| **Slot release safety** | Optimistic lock `@Version` | TimeSlot table has a version column; updates auto-detect concurrent conflicts |

## 5. Database Configuration

### Local Development (H2 In-Memory, no setup required)
Default profile works out of the box. Access H2 console at: `http://localhost:8080/h2-console`

### Aliyun Cloud Database (MySQL)
```bash
# Start with MySQL profile
java -jar target/booking-system-backend-1.0.0.jar --spring.profiles.active=mysql

# Or set environment variable
set SPRING_PROFILES_ACTIVE=mysql
mvn spring-boot:run
```

Connection details:
- Host: `47.111.224.168:3306`
- Database: `expert_system`
- Username: `expert`
- Password: `123456Abc`

## 6. Local Setup Guide

```bash
# 1. Navigate to backend directory
cd backend

# 2. Build and run tests
mvn clean test

# 3. Start the service (H2 in-memory by default)
mvn spring-boot:run

# 4. Verify
# Health check:  http://localhost:8080/api/v1/health
# H2 Console:    http://localhost:8080/h2-console
```

## 7. Branch & Commit Conventions

- Feature development: `feature/xxx`
- Bug fixes: `bugfix/xxx`
- Experimental code: `test/xxx`
- Commit format: `type(scope): description`

## 8. Notes

1. This module contains **BE2 backend code only**. No frontend is included.
2. Default profile uses H2 in-memory database. Use `--spring.profiles.active=mysql` to switch to MySQL.
3. Time slot creation and management is handled by other modules. This module only manages the booking workflow.
4. User authentication and authorization are handled by BE1. This module receives user IDs via API parameters.
