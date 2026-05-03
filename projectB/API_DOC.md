# CPT202 Project B - Backend API Documentation (BE1)

## 0. Base URL & Authentication Details
- **Base URL**: `http://localhost:8080`
- **Authentication**: JWT (JSON Web Token).
  - All endpoints EXCEPT `/auth/**` require a valid token.
  - Please include the token in the HTTP Request Header:
    - **Key**: `Authorization`
    - **Value**: `Bearer <Your_JWT_Token_Here>` (Note: There is a space after 'Bearer')

---

 1. User Authentication Module

 1.1 User Registration
Endpoint: `/auth/register`
Method: `POST`
Auth Required: No
Request Body* (`application/json`):
  ```json
  {
    "username": "admin01",
    "password": "password123",
    "role": "ROLE_ADMIN" 
  }
  (Note: The role should be either ROLE_ADMIN or ROLE_CUSTOMER. If not provided, the system defaults to ROLE_CUSTOMER.)

Success Response:

Code: 200 OK

Content: "User registered successfully!"
1.2 User Login
Endpoint: /auth/login

Method: POST

Auth Required: No

Request Body (application/json):
{
  "username": "admin01",
  "password": "password123"
}
Success Response:

Code: 200 OK

Content: (Returns the JWT Token string. The frontend must store this token locally for subsequent requests.)
2. Expert Management Module
2.1 Get All Experts List
Endpoint: /experts/list

Method: GET

Auth Required: Yes (Any valid role)

Success Response:

Code: 200 OK

Content: Returns a JSON array containing all expert objects.

2.2 Get Single Expert by ID
Endpoint: /experts/{id} (e.g., /experts/1)

Method: GET

Auth Required: Yes (Any valid role)

Success Response:

Code: 200 OK (Returns the specific expert JSON object)

Error Response:

Code: 404 Not Found (Content: "Expert not found")

2.3 Create a New Expert
Endpoint: /experts/create

Method: POST

Auth Required: Yes (ROLE_ADMIN Only)

Request Body (application/json):
{
  "name": "Dr. Alan Turing",
  "expertise": "Computer Science",
  "level": "Senior Consultant",
  "fee": 250.00,
  "status": "ACTIVE"
}
Success Response:

Code: 200 OK

Content: "Expert created successfully!"

2.4 Update Existing Expert
Endpoint: /experts/update/{id} (e.g., /experts/1)

Method: PUT

Auth Required: Yes (ROLE_ADMIN Only)

Request Body (application/json):
{
  "name": "Dr. Alan Turing (Updated)",
  "expertise": "Artificial Intelligence",
  "level": "Principal Consultant",
  "fee": 300.00,
  "status": "INACTIVE"
}
- **Success Response**: 
  - **Code**: `200 OK` 
  - **Content**: "Expert updated successfully!"

### 2.5 Delete an Expert
- **Endpoint**: `/experts/delete/{id}` (e.g., `/experts/1`)
- **Method**: `DELETE`
- **Auth Required**: Yes (**ROLE_ADMIN Only**)
- **Success Response**: 
  - **Code**: `200 OK` 
  - **Content**: "Expert deleted successfully!"