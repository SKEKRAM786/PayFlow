package com.payflow.dto.response;

import com.payflow.enums.TransactionStatus;
import com.payflow.enums.TransactionType;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record TransactionResponse(
        UUID id,
        String transactionReference,
        TransactionType transactionType,
        TransactionStatus transactionStatus,
        BigDecimal amount,
        String currency,
        Instant createdAt
) {}
