CPT202 Project B - Backend API Documentation (BE1)

0. Base URL & Authentication Details

Base URL: http://localhost:8080

Authentication: JWT (JSON Web Token).

All endpoints EXCEPT /api/v1/auth/ require a valid token.

Please include the token in the HTTP Request Header:

Key: Authorization

Value: Bearer <Your_JWT_Token_Here> (Note: There is a space after 'Bearer')

## 1. User Authentication Module

### 1.1 User Registration
* **Endpoint**: `/api/v1/auth/register`
* **Method**: `POST`
* **Auth Required**: No
* **Request Body** (`application/json`):
  ```json
  {
    "username": "admin01",
    "password": "password123",
    "role": "ROLE_ADMIN" 
  }

  *(Note: The role should be either ROLE_ADMIN, ROLE_CUSTOMER, or ROLE_SPECIALIST. If not provided, the system defaults to ROLE_CUSTOMER.)*
* **Success Response**: 
  * **Code**: `200 OK`
  * **Content**: 
    ```json
    {
      "message": "Register successful",
      "token": "eyJh...",
      "role": "ROLE_ADMIN",
      "userId": 1
    }
    
### 1.2 User Login
* **Endpoint**: `/api/v1/auth/login`
* **Method**: `POST`
* **Auth Required**: No
* **Request Body** (`application/json`):
  ```json
  {
    "username": "admin01",
    "password": "password123"
  }

* **Success Response**:
  * **Code**: `200 OK`
  * **Content**: 
    ```json
    {
      "message": "Login successful",
      "token": "eyJh...",
      "role": "ROLE_ADMIN",
      "userId": 1
    }
    
## 2. Customer Management Module
**Note: All endpoints below require a valid JWT token in the Authorization header.**

### 2.1 Get Customer Info by User ID
* **Endpoint**: `/api/v1/customers/by-user/{userId}`
* **Method**: `GET`
* **Auth Required**: Yes (Any valid role)
* **Description**: Returns the corresponding customer details (including customerId) for a logged-in user.
* **Success Response**: 
  * **Code**: `200 OK`
  * **Content**: 
    ```json
    {
      "id": 1,
      "name": "Tom",
      "phone": "123456789",
      "gender": "Male",
      "age": 21,
      "address": "Suzhou",
      "avatarUrl": "/uploads/1681234567_avatar.png",
      "user": {
          "id": 3,
          "username": "tom01",
          "role": "ROLE_CUSTOMER"
      }
    }


### 2.2 Update Customer Information
* **Endpoint**: `/api/v1/customers/{customerId}`
* **Method**: `PUT`
* **Auth Required**: Yes
* **Description**: Updates specific fields for a customer. Unprovided fields will remain unchanged.
* **Request Body**:
  ```json
  {
    "name": "Tom Updated",
    "phone": "987654321"
  }
  
Success Response:

Code: 200 OK

Content: "Customer information updated successfully!"

### 2.3 Upload Customer Avatar
* **Endpoint**: `/api/v1/customers/{customerId}/avatar`
* **Method**: `POST`
* **Auth Required**: Yes
* **Content-Type**: `multipart/form-data`
* **Request Parameters**: 
  * `file`: (File) The image file to upload.
* **Success Response**: 
  * **Code**: `200 OK`
  * **Content**:
    ```json
    {
      "message": "Avatar uploaded successfully!",
      "avatarUrl": "/uploads/1681234567_avatar.png"
    }



## 3. Account Security Module

### 3.1 Update Password
* **Endpoint**: `/api/v1/auth/user/{userId}/password`
* **Method**: `PUT`
* **Auth Required**: Yes
* **Request Body**:
  ```json
  {
    "newPassword": "newPassword123"
  }
  
Success Response:

Code: 200 OK

Content:

JSON
{
  "message": "Password updated successfully!"
}


### 3.2 Delete Account
* **Endpoint**: `/api/v1/auth/user/{userId}`
* **Method**: `DELETE`
* **Auth Required**: Yes
* **Description**: Deletes the user account and safely cascades the deletion to their associated customer profile.
* **Success Response**: 
  * **Code**: `200 OK`
  * **Content**: 
    ```json
    {
      "message": "Account deleted successfully!"
    }