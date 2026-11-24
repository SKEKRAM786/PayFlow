package com.payflow.dto.response;

import java.util.Map;

public record ReconciliationSummaryResponse(
        long totalRecords,
        long matchedCount,
        long amountMismatchCount,
        long statusMismatchCount,
        long missingInternalCount,
        long missingExternalCount,
        Map<String, Long> statusBreakdown
) {}
