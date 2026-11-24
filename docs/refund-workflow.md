# PayFlow Refund Workflow & Concurrency Controls

## 1. Refund Rules
- Only **CAPTURED** payments are eligible for refund.
- Total cumulative refunds (completed + pending) cannot exceed the original captured payment amount.
- Multiple partial refunds are permitted until the remaining balance reaches zero.
- Re-submitting an identical `idempotencyKey` returns the existing refund record safely.

## 2. Concurrency Sequence

```mermaid
sequenceDiagram
    autonumber
    actor Client
    participant Service as RefundService
    participant DB as PostgreSQL (Payment & Refund Repo)
    participant Provider as PaymentProvider (Simulator)

    Client->>Service: POST /api/payments/{id}/refunds (amount, reason, idempotencyKey)
    Service->>DB: Query payment with optimistic lock (@Version)
    Service->>DB: Calculate sum of existing refunds
    alt Refund amount exceeds remaining balance
        Service-->>Client: 400 Bad Request ("Refund exceeds refundable balance")
    else Balance is sufficient
        Service->>Provider: refund(paymentId, amount, currency)
        Provider-->>Service: ProviderResult(SUCCESS)
        Service->>DB: Save Refund (COMPLETED) + PaymentTransaction (REFUND)
        Service->>DB: Commit Payment version update
        Service-->>Client: 201 Created (RefundResponse)
    end
```
