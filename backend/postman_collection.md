# PickUp API Postman Collection

**Base URL**: `{{baseUrl}}` (Default: `http://localhost:5000/api/v1`)

## 📁 Auth
*Authentication endpoints*

### Register User
- **Method**: `POST`
- **URL**: `{{baseUrl}}/auth/register`
- **Body** (JSON):
  ```json
  {
    "phone": "+2348012345678",
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123",
    "role": "USER" // Optional: USER (default) or RIDER
  }
  ```

### Login
- **Method**: `POST`
- **URL**: `{{baseUrl}}/auth/login`
- **Body** (JSON):
  ```json
  {
    "email": "john@example.com", // OR "phone": "+2348012345678"
    "password": "password123"
  }
  ```

### Refresh Token
- **Method**: `POST`
- **URL**: `{{baseUrl}}/auth/refresh`
- **Body** (JSON):
  ```json
  {
    "refreshToken": "YOUR_REFRESH_TOKEN"
  }
  ```

### Get Current User Profile
- **Method**: `GET`
- **URL**: `{{baseUrl}}/auth/me`
- **Headers**: `Authorization: Bearer {{accessToken}}`

### Update Profile
- **Method**: `PATCH`
- **URL**: `{{baseUrl}}/auth/profile`
- **Headers**: `Authorization: Bearer {{accessToken}}`
- **Body** (JSON):
  ```json
  {
    "name": "John Updated",
    "address": "123 Main St"
  }
  ```

### Change Password
- **Method**: `POST`
- **URL**: `{{baseUrl}}/auth/change-password`
- **Headers**: `Authorization: Bearer {{accessToken}}`
- **Body** (JSON):
  ```json
  {
    "oldPassword": "password123",
    "newPassword": "newpassword456"
  }
  ```

### Logout
- **Method**: `POST`
- **URL**: `{{baseUrl}}/auth/logout`
- **Headers**: `Authorization: Bearer {{accessToken}}`

---

## 📁 Rider
*Rider management endpoints*

### Get Approved Riders (Public)
- **Method**: `GET`
- **URL**: `{{baseUrl}}/riders`

### Register as Rider
- **Method**: `POST`
- **URL**: `{{baseUrl}}/riders/register`
- **Headers**: `Authorization: Bearer {{accessToken}}`
- **Body** (form-data):
  - `plateNumber`: "ABC-123-XY"
  - `licenseNumber`: "LIC12345678"
  - `vehicleType`: "BIKE"
  - `vehiclePhoto`: [File]
  - `licensePhoto`: [File]

### Get Rider Profile
- **Method**: `GET`
- **URL**: `{{baseUrl}}/riders/profile`
- **Headers**: `Authorization: Bearer {{accessToken}}`

### Update Rider Profile
- **Method**: `PATCH`
- **URL**: `{{baseUrl}}/riders/profile`
- **Headers**: `Authorization: Bearer {{accessToken}}`
- **Body** (JSON):
  ```json
  {
    "vehicleColor": "Red"
  }
  ```

### Upload Documents
- **Method**: `POST`
- **URL**: `{{baseUrl}}/riders/documents`
- **Headers**: `Authorization: Bearer {{accessToken}}`
- **Body** (form-data):
  - `vehiclePhoto`: [File]

### Toggle Availability
- **Method**: `PATCH`
- **URL**: `{{baseUrl}}/riders/availability`
- **Headers**: `Authorization: Bearer {{accessToken}}`
- **Body** (JSON):
  ```json
  {
    "isAvailable": true
  }
  ```

### Update Location
- **Method**: `PATCH`
- **URL**: `{{baseUrl}}/riders/location`
- **Headers**: `Authorization: Bearer {{accessToken}}`
- **Body** (JSON):
  ```json
  {
    "latitude": 6.5244,
    "longitude": 3.3792
  }
  ```

### Get Statistics
- **Method**: `GET`
- **URL**: `{{baseUrl}}/riders/statistics`
- **Headers**: `Authorization: Bearer {{accessToken}}`

---

## 📁 Rides
*Ride management endpoints*

### Create Ride Request
- **Method**: `POST`
- **URL**: `{{baseUrl}}/rides`
- **Headers**: `Authorization: Bearer {{accessToken}}`
- **Body** (JSON):
  ```json
  {
    "pickupAddress": "Lagos",
    "pickupLatitude": 6.5244,
    "pickupLongitude": 3.3792,
    "dropoffAddress": "Ikeja",
    "dropoffLatitude": 6.6018,
    "dropoffLongitude": 3.3515,
    "vehicleType": "BIKE",
    "paymentMethod": "CASH"
  }
  ```

### Get Active Ride
- **Method**: `GET`
- **URL**: `{{baseUrl}}/rides/active`
- **Headers**: `Authorization: Bearer {{accessToken}}`

### Get Ride History
- **Method**: `GET`
- **URL**: `{{baseUrl}}/rides/history`
- **Headers**: `Authorization: Bearer {{accessToken}}`

### Get Specific Ride
- **Method**: `GET`
- **URL**: `{{baseUrl}}/rides/:id`
- **Headers**: `Authorization: Bearer {{accessToken}}`

### Accept Ride (Rider)
- **Method**: `POST`
- **URL**: `{{baseUrl}}/rides/:id/accept`
- **Headers**: `Authorization: Bearer {{accessToken}}`

### Decline Ride (Rider)
- **Method**: `POST`
- **URL**: `{{baseUrl}}/rides/:id/decline`
- **Headers**: `Authorization: Bearer {{accessToken}}`

### Mark Arrived (Rider)
- **Method**: `POST`
- **URL**: `{{baseUrl}}/rides/:id/arrived`
- **Headers**: `Authorization: Bearer {{accessToken}}`

### Start Ride (Rider)
- **Method**: `POST`
- **URL**: `{{baseUrl}}/rides/:id/start`
- **Headers**: `Authorization: Bearer {{accessToken}}`

### Complete Ride (Rider)
- **Method**: `POST`
- **URL**: `{{baseUrl}}/rides/:id/complete`
- **Headers**: `Authorization: Bearer {{accessToken}}`

### Cancel Ride (User)
- **Method**: `POST`
- **URL**: `{{baseUrl}}/rides/:id/cancel`
- **Headers**: `Authorization: Bearer {{accessToken}}`
- **Body** (JSON):
  ```json
  {
    "reason": "Driver took too long"
  }
  ```

---

## 📁 Wallet
*Wallet and transaction endpoints*

### Get Wallet Balance
- **Method**: `GET`
- **URL**: `{{baseUrl}}/wallet/balance`
- **Headers**: `Authorization: Bearer {{accessToken}}`

### Get Transaction History
- **Method**: `GET`
- **URL**: `{{baseUrl}}/wallet/transactions`
- **Headers**: `Authorization: Bearer {{accessToken}}`
- **Query Params**: `limit=50`

---

## 📁 Payment
*Payment processing endpoints*

### Get Payment Methods
- **Method**: `GET`
- **URL**: `{{baseUrl}}/payment/methods`

### Initialize Payment
- **Method**: `POST`
- **URL**: `{{baseUrl}}/payment/initialize`
- **Headers**: `Authorization: Bearer {{accessToken}}`
- **Body** (JSON):
  ```json
  {
    "rideId": "ride_id_here",
    "amount": 500,
    "provider": "paystack" // or flutterwave
  }
  ```

### Verify Payment
- **Method**: `POST`
- **URL**: `{{baseUrl}}/payment/verify`
- **Headers**: `Authorization: Bearer {{accessToken}}`
- **Body** (JSON):
  ```json
  {
    "reference": "payment_reference_here",
    "provider": "paystack"
  }
  ```

### Process Wallet Payment
- **Method**: `POST`
- **URL**: `{{baseUrl}}/payment/process`
- **Headers**: `Authorization: Bearer {{accessToken}}`
- **Body** (JSON):
  ```json
  {
    "rideId": "ride_id_here",
    "amount": 500,
    "method": "WALLET"
  }
  ```

---

## 📁 Location
*Location tracking endpoints*

### Update Location (Rider)
- **Method**: `PATCH`
- **URL**: `{{baseUrl}}/location/update`
- **Headers**: `Authorization: Bearer {{accessToken}}`
- **Body** (JSON):
  ```json
  {
    "latitude": 6.5244,
    "longitude": 3.3792,
    "heading": 90
  }
  ```

### Get Tracking Info
- **Method**: `GET`
- **URL**: `{{baseUrl}}/location/tracking/:rideId`
- **Headers**: `Authorization: Bearer {{accessToken}}`

### Get Route Polyline
- **Method**: `GET`
- **URL**: `{{baseUrl}}/location/route`
- **Query Params**: `origin=lat,lng&destination=lat,lng`

---

## 📁 Ratings
*Rating and review endpoints*

### Create Rating
- **Method**: `POST`
- **URL**: `{{baseUrl}}/ratings`
- **Headers**: `Authorization: Bearer {{accessToken}}`
- **Body** (JSON):
  ```json
  {
    "rideId": "ride_id_here",
    "rating": 5,
    "comment": "Great ride!"
  }
  ```

### Get Pending Ratings
- **Method**: `GET`
- **URL**: `{{baseUrl}}/ratings/pending`
- **Headers**: `Authorization: Bearer {{accessToken}}`

### Get Rating Stats
- **Method**: `GET`
- **URL**: `{{baseUrl}}/ratings/stats`
- **Headers**: `Authorization: Bearer {{accessToken}}`

---

## 📁 Admin
*Administrative endpoints (Requires ADMIN role)*

### Get Pending Riders
- **Method**: `GET`
- **URL**: `{{baseUrl}}/admin/riders/pending`
- **Headers**: `Authorization: Bearer {{accessToken}}`

### Approve Rider
- **Method**: `POST`
- **URL**: `{{baseUrl}}/admin/riders/:id/approve`
- **Headers**: `Authorization: Bearer {{accessToken}}`

### Reject Rider
- **Method**: `POST`
- **URL**: `{{baseUrl}}/admin/riders/:id/reject`
- **Headers**: `Authorization: Bearer {{accessToken}}`

---

## 📁 Webhooks
*External service callbacks*

### Monnify Webhook
- **Method**: `POST`
- **URL**: `{{baseUrl}}/webhook/monnify`
- **Headers**: `monnify-signature: <signature>`
- **Body**: (Monnify Payload)

### Paystack Webhook
- **Method**: `POST`
- **URL**: `{{baseUrl}}/payment/webhooks/paystack`

### Flutterwave Webhook
- **Method**: `POST`
- **URL**: `{{baseUrl}}/payment/webhooks/flutterwave`
