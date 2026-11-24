package com.payflow.dto.response;

import com.payflow.enums.PaymentMethod;
import com.payflow.enums.PaymentStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record PaymentResponse(
        UUID id,
        String paymentReference,
        UUID customerId,
        String customerName,
        BigDecimal amount,
        String currency,
        PaymentMethod paymentMethod,
        PaymentStatus paymentStatus,
        String idempotencyKey,
        String description,
        List<TransactionResponse> transactions,
        Instant createdAt,
        Instant updatedAt
) {}
