package com.payflow.service;

import com.payflow.dto.response.FinancialSummaryResponse;
import com.payflow.dto.response.PaymentTrendItem;
import com.payflow.dto.response.ReconciliationStatsResponse;
import com.payflow.dto.response.RefundStatsResponse;
import com.payflow.dto.response.TransactionStatsResponse;
import com.payflow.entity.Customer;
import com.payflow.entity.Payment;
import com.payflow.entity.PaymentTransaction;
import com.payflow.entity.Refund;
import com.payflow.enums.*;
import com.payflow.repository.*;
import com.payflow.service.impl.DashboardAnalyticsServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DashboardAnalyticsServiceUnitTest {

    @Mock
    private PaymentRepository paymentRepository;

    @Mock
    private PaymentTransactionRepository transactionRepository;

    @Mock
    private RefundRepository refundRepository;

    @Mock
    private ReconciliationRecordRepository reconciliationRecordRepository;

    private DashboardAnalyticsServiceImpl analyticsService;

    @BeforeEach
    void setUp() {
        analyticsService = new DashboardAnalyticsServiceImpl(
                paymentRepository,
                transactionRepository,
                refundRepository,
                reconciliationRecordRepository
        );
    }

    @Test
    @DisplayName("Should correctly calculate financial summary partitioned by currency with no crossover")
    void testGetSummary() {
        Customer customer = new Customer("Acme Corp", "acme@test.com", "+1-555-0100");

        Payment p1 = new Payment(customer, new BigDecimal("100.0000"), "USD", PaymentMethod.CARD_SIMULATED, "IDEM-001", "PAY-001");
        p1.setPaymentStatus(PaymentStatus.CAPTURED);

        Payment p2 = new Payment(customer, new BigDecimal("5000.0000"), "INR", PaymentMethod.CARD_SIMULATED, "IDEM-002", "PAY-002");
        p2.setPaymentStatus(PaymentStatus.CAPTURED);

        Payment p3 = new Payment(customer, new BigDecimal("50.0000"), "USD", PaymentMethod.CARD_SIMULATED, "IDEM-003", "PAY-003");
        p3.setPaymentStatus(PaymentStatus.PENDING);

        when(paymentRepository.findAll()).thenReturn(List.of(p1, p2, p3));
        when(refundRepository.findAll()).thenReturn(List.of());

        FinancialSummaryResponse summary = analyticsService.getSummary(null, null, null);

        assertThat(summary.totalPayments()).isEqualTo(3);
        assertThat(summary.successfulPayments()).isEqualTo(2);
        assertThat(summary.pendingPayments()).isEqualTo(1);
        assertThat(summary.failedPayments()).isZero();

        assertThat(summary.totalCapturedVolumeByCurrency()).containsEntry("USD", new BigDecimal("100.0000"));
        assertThat(summary.totalCapturedVolumeByCurrency()).containsEntry("INR", new BigDecimal("5000.0000"));
        assertThat(summary.netVolumeByCurrency()).containsEntry("USD", new BigDecimal("100.0000"));
        assertThat(summary.netVolumeByCurrency()).containsEntry("INR", new BigDecimal("5000.0000"));
    }

    @Test
    @DisplayName("Should return empty dataset gracefully when database contains zero records")
    void testGetSummaryEmpty() {
        when(paymentRepository.findAll()).thenReturn(List.of());
        when(refundRepository.findAll()).thenReturn(List.of());

        FinancialSummaryResponse summary = analyticsService.getSummary("USD", null, null);

        assertThat(summary.totalPayments()).isZero();
        assertThat(summary.successfulPayments()).isZero();
        assertThat(summary.totalCapturedVolumeByCurrency()).isEmpty();
        assertThat(summary.netVolumeByCurrency()).isEmpty();
    }

    @Test
    @DisplayName("Should aggregate reconciliation records by status")
    void testGetReconciliationStats() {
        List<Object[]> groupedCounts = List.of(
                new Object[]{ReconciliationStatus.MATCHED, 8L},
                new Object[]{ReconciliationStatus.AMOUNT_MISMATCH, 2L},
                new Object[]{ReconciliationStatus.MISSING_INTERNAL, 1L}
        );

        when(reconciliationRecordRepository.countByStatusGroup()).thenReturn(groupedCounts);

        ReconciliationStatsResponse stats = analyticsService.getReconciliationStats();

        assertThat(stats.totalRecords()).isEqualTo(11);
        assertThat(stats.matchedRecords()).isEqualTo(8);
        assertThat(stats.amountMismatches()).isEqualTo(2);
        assertThat(stats.missingInternalRecords()).isEqualTo(1);
    }
}
