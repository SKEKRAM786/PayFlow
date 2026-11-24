package com.payflow.dto.response;

import java.math.BigDecimal;
import java.util.Map;

public record FinancialSummaryResponse(
        long totalPayments,
        long successfulPayments,
        long failedPayments,
        long pendingPayments,
        Map<String, BigDecimal> totalCapturedVolumeByCurrency,
        Map<String, BigDecimal> totalRefundedVolumeByCurrency,
        Map<String, BigDecimal> netVolumeByCurrency
) {}
