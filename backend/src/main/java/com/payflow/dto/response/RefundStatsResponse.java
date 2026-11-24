package com.payflow.dto.response;

import java.math.BigDecimal;
import java.util.Map;

public record RefundStatsResponse(
        long totalRefunds,
        long completedRefunds,
        long pendingRefunds,
        long failedRefunds,
        Map<String, BigDecimal> refundedAmountByCurrency
) {}
