package com.payflow.dto.response;

import java.util.Map;

public record TransactionStatsResponse(
        long totalTransactions,
        long successfulTransactions,
        long failedTransactions,
        long pendingTransactions,
        Map<String, Long> typeDistribution
) {}
