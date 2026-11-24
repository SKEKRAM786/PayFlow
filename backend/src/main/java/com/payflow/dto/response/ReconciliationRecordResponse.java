package com.payflow.dto.response;

import com.payflow.enums.ReconciliationStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record ReconciliationRecordResponse(
        UUID id,
        UUID batchId,
        String batchReference,
        UUID transactionId,
        String internalReference,
        String externalReference,
        BigDecimal expectedAmount,
        BigDecimal actualAmount,
        String currency,
        ReconciliationStatus reconciliationStatus,
        String mismatchReason,
        Instant reconciledAt
) {}
