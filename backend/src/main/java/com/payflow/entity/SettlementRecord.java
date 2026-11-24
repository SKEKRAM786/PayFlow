package com.payflow.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
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
@Table(name = "settlement_records", indexes = {
        @Index(name = "idx_settle_batch_id", columnList = "batch_id"),
        @Index(name = "idx_settle_tx_ref", columnList = "transaction_reference"),
        @Index(name = "idx_settle_pay_ref", columnList = "payment_reference")
})
public class SettlementRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @NotNull(message = "Batch is required")
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "batch_id", nullable = false, foreignKey = @ForeignKey(name = "fk_settle_batch"))
    @JsonIgnore
    private SettlementBatch batch;

    @NotBlank(message = "Transaction reference is required")
    @Size(max = 120)
    @Column(name = "transaction_reference", nullable = false, length = 120)
    private String transactionReference;

    @Size(max = 120)
    @Column(name = "payment_reference", length = 120)
    private String paymentReference;

    @NotNull(message = "Amount is required")
    @DecimalMin(value = "0.01", message = "Amount must be greater than zero")
    @Column(name = "amount", nullable = false, precision = 18, scale = 4)
    private BigDecimal amount;

    @NotBlank(message = "Currency is required")
    @Size(min = 3, max = 3)
    @Column(name = "currency", nullable = false, length = 3)
    private String currency;

    @Size(max = 60)
    @Column(name = "settlement_status", length = 60)
    private String settlementStatus;

    @Column(name = "settlement_date")
    private Instant settlementDate;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    public SettlementRecord() {}

    public SettlementRecord(SettlementBatch batch, String transactionReference, String paymentReference,
                            BigDecimal amount, String currency, String settlementStatus, Instant settlementDate) {
        this.batch = batch;
        this.transactionReference = transactionReference;
        this.paymentReference = paymentReference;
        this.amount = amount;
        this.currency = currency;
        this.settlementStatus = settlementStatus;
        this.settlementDate = settlementDate;
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public SettlementBatch getBatch() { return batch; }
    public void setBatch(SettlementBatch batch) { this.batch = batch; }
    public String getTransactionReference() { return transactionReference; }
    public void setTransactionReference(String transactionReference) { this.transactionReference = transactionReference; }
    public String getPaymentReference() { return paymentReference; }
    public void setPaymentReference(String paymentReference) { this.paymentReference = paymentReference; }
    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }
    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }
    public String getSettlementStatus() { return settlementStatus; }
    public void setSettlementStatus(String settlementStatus) { this.settlementStatus = settlementStatus; }
    public Instant getSettlementDate() { return settlementDate; }
    public void setSettlementDate(Instant settlementDate) { this.settlementDate = settlementDate; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
