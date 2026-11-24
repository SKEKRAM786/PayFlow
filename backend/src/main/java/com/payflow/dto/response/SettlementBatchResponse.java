package com.payflow.dto.response;

import com.payflow.enums.BatchStatus;

import java.time.Instant;
import java.util.UUID;

public record SettlementBatchResponse(
        UUID id,
        String batchReference,
        String fileName,
        int totalRecords,
        int matchedRecords,
        int mismatchedRecords,
        BatchStatus status,
        Instant createdAt,
        Instant updatedAt
) {}
