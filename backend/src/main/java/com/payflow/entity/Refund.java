package com.payflow.entity;

import com.payflow.enums.RefundStatus;
import jakarta.persistence.*;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "refunds", indexes = {
        @Index(name = "idx_refunds_payment_id", columnList = "payment_id"),
        @Index(name = "idx_refunds_transaction_id", columnList = "transaction_id"),
        @Index(name = "idx_refunds_status", columnList = "refund_status"),
        @Index(name = "idx_refunds_reference", columnList = "refund_reference", unique = true),
        @Index(name = "idx_refunds_idempotency", columnList = "idempotency_key", unique = true)
})
public class Refund {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Size(max = 64)
    @Column(name = "refund_reference", unique = true, length = 64)
    private String refundReference;

    @Size(max = 120)
    @Column(name = "idempotency_key", unique = true, length = 120)
    private String idempotencyKey;

    @NotNull(message = "Payment is required")
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "payment_id", nullable = false, foreignKey = @ForeignKey(name = "fk_refunds_payment"))
    private Payment payment;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "transaction_id", foreignKey = @ForeignKey(name = "fk_refunds_transaction"))
    private PaymentTransaction transaction;

    @NotNull(message = "Refund amount is required")
    @DecimalMin(value = "0.01", message = "Refund amount must be greater than zero")
    @Column(name = "refund_amount", nullable = false, precision = 18, scale = 4)
    private BigDecimal refundAmount;

    @Size(max = 255)
    @Column(name = "refund_reason", length = 255)
    private String refundReason;

    @NotNull(message = "Refund status is required")
    @Enumerated(EnumType.STRING)
    @Column(name = "refund_status", nullable = false, length = 30)
    private RefundStatus refundStatus = RefundStatus.PENDING;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public Refund() {}

    public Refund(Payment payment, PaymentTransaction transaction, BigDecimal refundAmount, String refundReason) {
        this.payment = payment;
        this.transaction = transaction;
        this.refundAmount = refundAmount;
        this.refundReason = refundReason;
        this.refundStatus = RefundStatus.PENDING;
    }

    public Refund(Payment payment, String refundReference, String idempotencyKey, BigDecimal refundAmount, String refundReason) {
        this.payment = payment;
        this.refundReference = refundReference;
        this.idempotencyKey = idempotencyKey;
        this.refundAmount = refundAmount;
        this.refundReason = refundReason;
        this.refundStatus = RefundStatus.PENDING;
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public String getRefundReference() { return refundReference; }
    public void setRefundReference(String refundReference) { this.refundReference = refundReference; }
    public String getIdempotencyKey() { return idempotencyKey; }
    public void setIdempotencyKey(String idempotencyKey) { this.idempotencyKey = idempotencyKey; }
    public Payment getPayment() { return payment; }
    public void setPayment(Payment payment) { this.payment = payment; }
    public PaymentTransaction getTransaction() { return transaction; }
    public void setTransaction(PaymentTransaction transaction) { this.transaction = transaction; }
    public BigDecimal getRefundAmount() { return refundAmount; }
    public void setRefundAmount(BigDecimal refundAmount) { this.refundAmount = refundAmount; }
    public String getRefundReason() { return refundReason; }
    public void setRefundReason(String refundReason) { this.refundReason = refundReason; }
    public RefundStatus getRefundStatus() { return refundStatus; }
    public void setRefundStatus(RefundStatus refundStatus) { this.refundStatus = refundStatus; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
