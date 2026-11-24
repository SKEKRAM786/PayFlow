# PayFlow Technical Documentation Index

Welcome to the comprehensive technical documentation for **PayFlow**, a production-style Enterprise Payment Processing Platform.

## Documentation Index

- [Architecture & Modular Monolith Design](file:///c:/Payflow/docs/architecture.md)
- [Database Schema & Entity-Relationship Design](file:///c:/Payflow/docs/database-design.md)
- [REST API Reference & OpenAPI Specification](file:///c:/Payflow/docs/api-documentation.md)
- [Authentication, JWT & Security Architecture](file:///c:/Payflow/docs/authentication-security.md)
- [Payment Processing Lifecycle & Idempotency](file:///c:/Payflow/docs/payment-lifecycle.md)
- [Refund Processing & Concurrency Controls](file:///c:/Payflow/docs/refund-workflow.md)
- [Reconciliation Engine & Bank Settlement Ingestion](file:///c:/Payflow/docs/reconciliation-workflow.md)
- [Quality Assurance & Automated Testing Guide](file:///c:/Payflow/docs/testing-guide.md)
- [Cloud Deployment & Dockerization Guide](file:///c:/Payflow/docs/deployment-guide.md)
- [High-Level System Design & Scaling Considerations](file:///c:/Payflow/docs/system-design.md)
- [Implementation & Build Status Matrix](file:///c:/Payflow/docs/BUILD_STATUS.md)

---

## High-Level Platform Overview

```mermaid
flowchart TD
    Client["React 18 SPA (Vite + Dark/Light Theme)"]
    API_Gateway["Reverse Proxy / Nginx Unprivileged"]
    Security_Filter["Spring Security 6 (Stateless JWT Filter)"]
    
    subgraph Core_Monolith["PayFlow Backend Engine (Java 21 / Spring Boot 3)"]
        AuthModule["Auth & User Module"]
        CustomerModule["Customer Management"]
        PaymentEngine["Payment Processing Engine (Simulator)"]
        TxModule["Transaction History & Ledger"]
        RefundModule["Refund Lifecycle Module"]
        ReconEngine["Reconciliation & CSV Parser"]
        AnalyticsModule["Dashboard Analytics Telemetry"]
        NotificationModule["Notifications & Real-Time SSE Stream"]
        AuditModule["Immutable Audit Trail"]
    end
    
    subgraph Data_Layer["Persistence Layer (PostgreSQL 16)"]
        Flyway["Flyway Migrations (V1 to V7)"]
        Postgres[(Relational Tables & Foreign Keys)]
    end

    Client -->|HTTPS / REST & SSE| API_Gateway
    API_Gateway --> Security_Filter
    Security_Filter --> Core_Monolith
    Core_Monolith --> Data_Layer
```
