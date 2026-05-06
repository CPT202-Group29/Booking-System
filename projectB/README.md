# CPT202 Project B - Backend Module 1 (BE1)

## Entity-Relationship Diagram (ERD)

Below is the database design for the User Authentication and Expert Management module:
```mermaid
erDiagram
    USERS {
        BIGINT id PK "Auto-increment Primary Key"
        VARCHAR username "Username (Unique)"
        VARCHAR password "Encrypted Password"
        VARCHAR role "User Role (e.g., ROLE_ADMIN, ROLE_CUSTOMER, ROLE_SPECIALIST)"
    }

    CUSTOMERS {
        BIGINT id PK "Auto-increment Primary Key"
        VARCHAR name "Customer Name"
        VARCHAR phone "Phone Number"
        VARCHAR gender "Gender"
        INT age "Age"
        VARCHAR address "Home Address"
        VARCHAR avatarUrl "Avatar Image Path"
        BIGINT user_id FK "Foreign Key linking to USERS.id"
    }

    

    USERS ||--o| CUSTOMERS : "has customer profile"
