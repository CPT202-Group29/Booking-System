# BE1 Database ERD

```mermaid
erDiagram
    USERS {
        BIGINT id PK "Auto-increment Primary Key"
        VARCHAR username UK "Email used as username"
        VARCHAR password "BCrypt encrypted password"
        VARCHAR role "User role (e.g., ROLE_CUSTOMER)"
        LONGTEXT avatar "Base64 image data"
        DATETIME created_at "Registration time"
    }
    CUSTOMERS {
        BIGINT id PK "Auto-increment Primary Key"
        BIGINT user_id FK "Foreign Key to USERS.id"
        VARCHAR name "Customer name"
        VARCHAR phone "Phone number"
        VARCHAR gender "Gender"
        INT age "Age"
        VARCHAR address "Home address"
        TEXT avatar_url "Avatar file path or Base64"
    }
    USERS ||--o| CUSTOMERS : "1:1"
