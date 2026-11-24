package com.payflow.dto.response;

import java.math.BigDecimal;
import java.util.Map;

public record DashboardStatsResponse(
        long totalPayments,
        long successfulPayments,
        long pendingPayments,
        long failedPayments,
        long cancelledPayments,
        BigDecimal totalVolumeUsd,
        BigDecimal totalVolumeInr,
        BigDecimal totalVolumeAed,
        long totalCustomers,
        long totalRefunds,
        BigDecimal totalRefundedAmount,
        long totalReconciledRecords,
        long totalDiscrepancies
) {}
