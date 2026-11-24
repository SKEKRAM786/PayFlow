# PayFlow System Design & Scaling Considerations

## 1. Modular Monolith Architecture
PayFlow is intentionally architected as a clean modular monolith:
- Clear separation between domains (`auth`, `customer`, `payment`, `transaction`, `refund`, `reconciliation`, `analytics`, `notification`).
- Single database schema managed deterministically through Flyway.
- Internal communication between modules via strongly-typed Java interfaces and DTO records.

## 2. High-Throughput Payment Processing
- **Virtual Threads**: Java 21 Virtual Threads (`Loom`) for high-concurrency I/O without native thread exhaustion.
- **Connection Pooling**: HikariCP with connection timeout and idle lifecycle limits.
- **Pessimistic vs Optimistic Locking**: Optimistic versioning (`@Version`) used for high-read, low-contention payment records to maximize transaction throughput.

## 3. Real-Time Telemetry & Notifications
- Server-Sent Events (`SseEmitter`) for one-way server-to-client event streaming without WebSocket protocol overhead.
- In-memory concurrent emitter map partitioned by `userId`.
