# API Interface Definitions

| Endpoint | Method | Request Body / Parameters | Response (Success) | Response (Error) |
|----------|--------|--------------------------|-------------------|------------------|
| `/api/v1/auth/register` | POST | `{name, email, password, verificationCode}` | `201` + `{token, userId, role}` | `400` – invalid code / email exists |
| `/api/v1/auth/login` | POST | `{username, password}` | `200` + `{token, userId, role}` | `401` – wrong credentials |
| `/api/v1/auth/send-code` | POST | `{email}` | `200` – OK | `400` – invalid email |
| `/api/users/me/avatar` | POST | Multipart file + JWT in header | `200` + `{message, avatarUrl}` | `400` – file empty / >2MB, `401` – unauthorized |
| `/api/v1/customers/{customerId}/avatar` | POST | Multipart file + JWT | `200` + `{message, avatarUrl}` | `400` – invalid file, `403` – not owner |
