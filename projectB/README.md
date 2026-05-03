# CPT202 Project B - Backend Module 1 (BE1)

## Entity-Relationship Diagram (ERD)

Below is the database design for the User Authentication and Expert Management module:
```mermaid
erDiagram
    USERS {
        BIGINT id PK "Auto-increment Primary Key"
        VARCHAR username "Username (Unique)"
        VARCHAR password "Encrypted Password"
        VARCHAR role "User Role (e.g., ROLE_ADMIN, ROLE_CUSTOMER)"
    }

    EXPERTS {
        BIGINT id PK "Auto-increment Primary Key"
        VARCHAR name "Expert Name"
        VARCHAR expertise "Area of Expertise"
        VARCHAR level "Expert Level (e.g., Senior, Junior)"
        DOUBLE fee "Consultation Fee"
        VARCHAR status "Working Status (e.g., ACTIVE, INACTIVE)"
    }