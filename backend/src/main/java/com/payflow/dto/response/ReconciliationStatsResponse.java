package com.payflow.dto.response;

public record ReconciliationStatsResponse(
        long totalRecords,
        long matchedRecords,
        long mismatchedRecords,
        long amountMismatches,
        long statusMismatches,
        long missingInternalRecords,
        long missingExternalRecords
) {}
