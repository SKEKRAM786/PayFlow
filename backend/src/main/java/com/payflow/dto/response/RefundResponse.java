package com.payflow.dto.response;

import com.payflow.enums.RefundStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record RefundResponse(
        UUID id,
        String refundReference,
        UUID paymentId,
        String paymentReference,
        UUID transactionId,
        String transactionReference,
        BigDecimal refundAmount,
        String currency,
        String refundReason,
        RefundStatus refundStatus,
        String idempotencyKey,
        Instant createdAt,
        Instant updatedAt
) {}
