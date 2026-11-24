# PayFlow REST API Documentation

PayFlow provides RESTful APIs secured by Spring Security and JWT Bearer tokens.

## Interactive Swagger UI
When running the backend service locally:
- **Swagger UI**: `http://localhost:8080/swagger-ui.html`
- **OpenAPI JSON Spec**: `http://localhost:8080/v3/api-docs`

---

## API Summary by Module

### 1. Authentication (`/api/auth`)
- `POST /api/auth/register`: Register user account (default `CUSTOMER` role).
- `POST /api/auth/login`: Authenticate email/password; returns JWT access token and user metadata.
- `GET /api/auth/me`: Retrieve currently authenticated user profile.

### 2. User Administration (`/api/users`)
- `GET /api/users`: Paginated list of registered users (`hasRole('ADMIN')`).
- `GET /api/users/{id}`: Detailed user account by UUID.

### 3. Customer Management (`/api/customers`)
- `POST /api/customers`: Create customer profile.
- `GET /api/customers`: Paginated search by name, email, and status.
- `GET /api/customers/{id}`: Fetch customer details (enforces ownership for `CUSTOMER`).
- `PUT /api/customers/{id}`: Update customer profile.
- `PATCH /api/customers/{id}/status`: Activate or deactivate customer (`ADMIN` only).
- `DELETE /api/customers/{id}`: Soft-delete customer if no pending/captured payments exist.

### 4. Payment Processing (`/api/payments`)
- `POST /api/payments`: Create a payment in `PENDING` state (requires `idempotencyKey`).
- `GET /api/payments`: Paginated payment listing with reference, status, and currency filters.
- `GET /api/payments/{id}`: Payment details with associated transactions and refunds.
- `POST /api/payments/{id}/authorize`: Authorize payment via simulated payment provider.
- `POST /api/payments/{id}/capture`: Capture authorized payment funds.
- `POST /api/payments/{id}/cancel`: Cancel pending/authorized payment before capture.
- `GET /api/payments/{id}/refundable-amount`: Live query for remaining refundable balance.

### 5. Transaction Management (`/api/transactions`)
- `GET /api/transactions`: Multi-attribute ledger query (type, status, currency, date range, search).
- `GET /api/transactions/{id}`: Fetch single transaction by UUID.
- `GET /api/transactions/reference/{reference}`: Fetch single transaction by reference string.
- `GET /api/transactions/payment/{paymentId}`: List all ledger entries for a payment.

### 6. Refund Lifecycle (`/api/refunds` & `/api/payments/{id}/refunds`)
- `POST /api/payments/{id}/refunds`: Initiate full or partial refund (requires `idempotencyKey`).
- `GET /api/refunds`: Paginated list of refunds with filters.
- `GET /api/refunds/{id}`: Single refund details.
- `GET /api/payments/{id}/refunds`: List refunds for a specific payment.

### 7. Bank Reconciliation (`/api/reconciliation`)
- `POST /api/reconciliation/import`: Upload settlement CSV file (`multipart/form-data`).
- `POST /api/reconciliation/run?batchId={id}`: Execute automated multi-criteria matching.
- `GET /api/reconciliation/batches`: List imported settlement batches.
- `GET /api/reconciliation/records`: List reconciliation comparison records.
- `GET /api/reconciliation/summary`: Aggregated status metrics across batches.
- `GET /api/reconciliation/export`: Stream reconciliation report as CSV (formula sanitized).

### 8. Analytics & Telemetry (`/api/dashboard`)
- `GET /api/dashboard/stats`: High-level counters and volumes.
- `GET /api/dashboard/summary`: Currency-partitioned captured, refunded, and net amounts.
- `GET /api/dashboard/payment-trends`: Grouped temporal volume buckets (`day` or `month`).
- `GET /api/dashboard/transaction-stats`: Status counts and transaction type distribution.
- `GET /api/dashboard/refund-stats`: Completed/pending/failed refunds and volumes by currency.
- `GET /api/dashboard/reconciliation-stats`: Matched and discrepancy counts.

### 9. Audit Logging (`/api/audit-logs`)
- `GET /api/audit-logs`: Paginated audit log stream with action, entity, user, and date filters (`ADMIN` only).
- `GET /api/audit-logs/{id}`: Single audit event details (`ADMIN` only).

### 10. In-App Notifications (`/api/notifications`)
- `GET /api/notifications`: User notifications with pagination.
- `GET /api/notifications/unread-count`: Unread notification count for the badge.
- `PATCH /api/notifications/{id}/read`: Mark notification as read.
- `PATCH /api/notifications/read-all`: Mark all notifications as read.
- `DELETE /api/notifications/{id}`: Delete notification.
- `GET /api/notifications/stream`: Real-time Server-Sent Events stream.
