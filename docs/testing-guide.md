# PayFlow Testing Guide

PayFlow enforces comprehensive automated quality assurance spanning unit, integration, and UI component tests.

## 1. Backend Testing (JUnit 5 & Mockito)

### Test Execution Command:
```bash
mvn clean test
```

### Key Test Suites:
- `HealthControllerTest`: WebMvc verification of the `/api/health` actuator.
- `RepositoryMappingTest`: DataJpa test validating PostgreSQL entities and constraints.
- `CustomerServiceIntegrationTest`: Integration test for customer CRUD, search, and soft-delete rules.
- `PaymentEngineIntegrationTest`: End-to-end payment creation, authorization, and capture flow.
- `TransactionServiceIntegrationTest`: Multi-attribute querying and ledger consistency.
- `RefundServiceIntegrationTest`: Cumulative refund balance ceiling, partial refunds, and idempotency.
- `ReconciliationServiceIntegrationTest`: CSV ingestion and multi-criteria comparison engine.
- `DashboardAnalyticsServiceUnitTest`: Currency-partitioned financial metrics calculation and empty-state handling.
- `NotificationServiceUnitTest`: Notification creation, unread counting, and ownership validation.

Total passing automated backend tests: **27 tests (0 failures, 0 errors)**.

---

## 2. Frontend Testing (Vitest & React Testing Library)

### Test Execution Command:
```bash
cd frontend
npm test
```

### Key Test Suites:
- `AuthComponents.test.jsx`: Login and Registration forms, validation messages, and token workflows.
- `DashboardPage.test.jsx`: Executive overview KPI cards and status distribution renders.
- `CustomerManager.test.jsx`: Customer table rendering, modal actions, and status updates.
- `PaymentManager.test.jsx`: Payment processing table, status badges, and action triggers.

Total passing frontend tests: **6 tests across 4 suites (0 failures, 0 errors)**.
