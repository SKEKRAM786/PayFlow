package com.payflow.service;

import com.payflow.dto.response.*;

import java.time.Instant;
import java.util.List;

public interface DashboardAnalyticsService {
    FinancialSummaryResponse getSummary(String currency, Instant startDate, Instant endDate);
    List<PaymentTrendItem> getPaymentTrends(String periodType, String currency, Instant startDate, Instant endDate);
    TransactionStatsResponse getTransactionStats(Instant startDate, Instant endDate);
    RefundStatsResponse getRefundStats(String currency, Instant startDate, Instant endDate);
    ReconciliationStatsResponse getReconciliationStats();
}
