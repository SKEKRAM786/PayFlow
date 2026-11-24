# PayFlow Bank Settlement Reconciliation Workflow

## 1. Process Overview
PayFlow compares internal ledger transactions against external bank settlement files (CSV format) to detect discrepancies.

```mermaid
flowchart TD
    CSV["Bank Settlement File (.csv)"] --> Parser["CSV Stream Parser & Validator"]
    Parser --> DuplicateCheck{"Check Duplicate External Ref"}
    DuplicateCheck -->|Duplicate| Reject["Reject / Return Existing Batch"]
    DuplicateCheck -->|New| Ingest["Save SettlementBatch & SettlementRecords"]
    
    Ingest --> ReconEngine["Reconciliation Engine (run)"]
    ReconEngine --> MatchCheck{"Match on Tx Ref & Payment Ref?"}
    
    MatchCheck -->|Found| CompAmt{"Compare Amounts"}
    CompAmt -->|Equal| CompStatus{"Compare Statuses"}
    CompStatus -->|Match| Matched["Status: MATCHED"]
    CompStatus -->|Mismatch| StatusMismatch["Status: STATUS_MISMATCH"]
    CompAmt -->|Mismatch| AmountMismatch["Status: AMOUNT_MISMATCH"]
    
    MatchCheck -->|Not Found| MissingInternal["Status: MISSING_INTERNAL"]
    
    Matched --> SaveRecon["Persist ReconciliationRecord"]
    StatusMismatch --> SaveRecon
    AmountMismatch --> SaveRecon
    MissingInternal --> SaveRecon
    
    SaveRecon --> Export["Streaming CSV Export (Sanitized)"]
```

## 2. Expected CSV Header
```csv
transaction_reference, payment_reference, amount, currency, settlement_date, settlement_status
```
