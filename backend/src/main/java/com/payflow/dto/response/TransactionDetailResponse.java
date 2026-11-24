package com.payflow.dto.response;

import com.payflow.enums.PaymentMethod;
import com.payflow.enums.PaymentStatus;
import com.payflow.enums.TransactionStatus;
import com.payflow.enums.TransactionType;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record TransactionDetailResponse(
        UUID id,
        String transactionReference,
        String providerReference,
        TransactionType transactionType,
        TransactionStatus transactionStatus,
        BigDecimal amount,
        String currency,
        String description,
        UUID paymentId,
        String paymentReference,
        PaymentStatus paymentStatus,
        PaymentMethod paymentMethod,
        UUID customerId,
        String customerName,
        Instant createdAt
) {}
