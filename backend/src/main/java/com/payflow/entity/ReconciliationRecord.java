package com.payflow.entity;

import com.payflow.enums.ReconciliationStatus;
import jakarta.persistence.*;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "reconciliation_records", indexes = {
        @Index(name = "idx_recon_transaction_id", columnList = "transaction_id"),
        @Index(name = "idx_recon_batch_id", columnList = "batch_id"),
        @Index(name = "idx_recon_external_ref", columnList = "external_reference"),
        @Index(name = "idx_recon_status", columnList = "reconciliation_status")
})
public class ReconciliationRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "transaction_id", foreignKey = @ForeignKey(name = "fk_recon_transaction"))
    private PaymentTransaction transaction;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "batch_id", foreignKey = @ForeignKey(name = "fk_recon_batch"))
    private SettlementBatch batch;

    @NotBlank(message = "External reference is required")
    @Size(max = 120)
    @Column(name = "external_reference", nullable = false, length = 120)
    private String externalReference;

    @Size(max = 120)
    @Column(name = "internal_reference", length = 120)
    private String internalReference;

    @NotNull(message = "Expected amount is required")
    @DecimalMin(value = "0.00", message = "Expected amount cannot be negative")
    @Column(name = "expected_amount", nullable = false, precision = 18, scale = 4)
    private BigDecimal expectedAmount;

    @NotNull(message = "Actual amount is required")
    @DecimalMin(value = "0.00", message = "Actual amount cannot be negative")
    @Column(name = "actual_amount", nullable = false, precision = 18, scale = 4)
    private BigDecimal actualAmount;

    @Size(max = 3)
    @Column(name = "currency", length = 3)
    private String currency;

    @NotNull(message = "Reconciliation status is required")
    @Enumerated(EnumType.STRING)
    @Column(name = "reconciliation_status", nullable = false, length = 30)
    private ReconciliationStatus reconciliationStatus;

    @Size(max = 255)
    @Column(name = "mismatch_reason", length = 255)
    private String mismatchReason;

    @Column(name = "reconciled_at")
    private Instant reconciledAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    public ReconciliationRecord() {}

    public ReconciliationRecord(PaymentTransaction transaction, SettlementBatch batch, String externalReference,
                                String internalReference, BigDecimal expectedAmount, BigDecimal actualAmount,
                                String currency, ReconciliationStatus status, String mismatchReason) {
        this.transaction = transaction;
        this.batch = batch;
        this.externalReference = externalReference;
        this.internalReference = internalReference;
        this.expectedAmount = expectedAmount;
        this.actualAmount = actualAmount;
        this.currency = currency;
        this.reconciliationStatus = status;
        this.mismatchReason = mismatchReason;
        this.reconciledAt = Instant.now();
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public PaymentTransaction getTransaction() { return transaction; }
    public void setTransaction(PaymentTransaction transaction) { this.transaction = transaction; }
    public SettlementBatch getBatch() { return batch; }
    public void setBatch(SettlementBatch batch) { this.batch = batch; }
    public String getExternalReference() { return externalReference; }
    public void setExternalReference(String externalReference) { this.externalReference = externalReference; }
    public String getInternalReference() { return internalReference; }
    public void setInternalReference(String internalReference) { this.internalReference = internalReference; }
    public BigDecimal getExpectedAmount() { return expectedAmount; }
    public void setExpectedAmount(BigDecimal expectedAmount) { this.expectedAmount = expectedAmount; }
    public BigDecimal getActualAmount() { return actualAmount; }
    public void setActualAmount(BigDecimal actualAmount) { this.actualAmount = actualAmount; }
    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }
    public ReconciliationStatus getReconciliationStatus() { return reconciliationStatus; }
    public void setReconciliationStatus(ReconciliationStatus reconciliationStatus) { this.reconciliationStatus = reconciliationStatus; }
    public String getMismatchReason() { return mismatchReason; }
    public void setMismatchReason(String mismatchReason) { this.mismatchReason = mismatchReason; }
    public Instant getReconciledAt() { return reconciledAt; }
    public void setReconciledAt(Instant reconciledAt) { this.reconciledAt = reconciledAt; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
