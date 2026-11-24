package com.payflow.service.impl;

import com.payflow.dto.response.*;
import com.payflow.entity.Payment;
import com.payflow.entity.PaymentTransaction;
import com.payflow.entity.Refund;
import com.payflow.enums.PaymentStatus;
import com.payflow.enums.ReconciliationStatus;
import com.payflow.enums.RefundStatus;
import com.payflow.enums.TransactionStatus;
import com.payflow.repository.PaymentRepository;
import com.payflow.repository.PaymentTransactionRepository;
import com.payflow.repository.ReconciliationRecordRepository;
import com.payflow.repository.RefundRepository;
import com.payflow.service.DashboardAnalyticsService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class DashboardAnalyticsServiceImpl implements DashboardAnalyticsService {

    private final PaymentRepository paymentRepository;
    private final PaymentTransactionRepository transactionRepository;
    private final RefundRepository refundRepository;
    private final ReconciliationRecordRepository reconciliationRecordRepository;

    private static final DateTimeFormatter DAY_FORMAT = DateTimeFormatter.ofPattern("yyyy-MM-dd").withZone(ZoneId.of("UTC"));
    private static final DateTimeFormatter MONTH_FORMAT = DateTimeFormatter.ofPattern("yyyy-MM").withZone(ZoneId.of("UTC"));

    public DashboardAnalyticsServiceImpl(PaymentRepository paymentRepository,
                                         PaymentTransactionRepository transactionRepository,
                                         RefundRepository refundRepository,
                                         ReconciliationRecordRepository reconciliationRecordRepository) {
        this.paymentRepository = paymentRepository;
        this.transactionRepository = transactionRepository;
        this.refundRepository = refundRepository;
        this.reconciliationRecordRepository = reconciliationRecordRepository;
    }

    @Override
    public FinancialSummaryResponse getSummary(String currency, Instant startDate, Instant endDate) {
        List<Payment> payments = paymentRepository.findAll().stream()
                .filter(p -> currency == null || currency.isBlank() || p.getCurrency().equalsIgnoreCase(currency.trim()))
                .filter(p -> startDate == null || !p.getCreatedAt().isBefore(startDate))
                .filter(p -> endDate == null || !p.getCreatedAt().isAfter(endDate))
                .toList();

        long totalPayments = payments.size();
        long successful = payments.stream().filter(p -> p.getPaymentStatus() == PaymentStatus.CAPTURED).count();
        long failed = payments.stream().filter(p -> p.getPaymentStatus() == PaymentStatus.FAILED).count();
        long pending = payments.stream().filter(p -> p.getPaymentStatus() == PaymentStatus.PENDING || p.getPaymentStatus() == PaymentStatus.AUTHORIZED).count();

        // Captured volumes grouped by currency
        Map<String, BigDecimal> capturedByCurr = payments.stream()
                .filter(p -> p.getPaymentStatus() == PaymentStatus.CAPTURED)
                .collect(Collectors.groupingBy(
                        Payment::getCurrency,
                        Collectors.reducing(BigDecimal.ZERO, Payment::getAmount, BigDecimal::add)
                ));

        // Refunded volumes grouped by currency
        List<Refund> refunds = refundRepository.findAll().stream()
                .filter(r -> r.getRefundStatus() == RefundStatus.COMPLETED)
                .filter(r -> startDate == null || !r.getCreatedAt().isBefore(startDate))
                .filter(r -> endDate == null || !r.getCreatedAt().isAfter(endDate))
                .toList();

        Map<String, BigDecimal> refundedByCurr = refunds.stream()
                .filter(r -> currency == null || currency.isBlank() || (r.getPayment() != null && r.getPayment().getCurrency().equalsIgnoreCase(currency.trim())))
                .collect(Collectors.groupingBy(
                        r -> r.getPayment() != null ? r.getPayment().getCurrency() : "UNKNOWN",
                        Collectors.reducing(BigDecimal.ZERO, Refund::getRefundAmount, BigDecimal::add)
                ));

        // Net volumes per currency
        Map<String, BigDecimal> netByCurr = new LinkedHashMap<>();
        Set<String> allCurrencies = new HashSet<>(capturedByCurr.keySet());
        allCurrencies.addAll(refundedByCurr.keySet());

        for (String curr : allCurrencies) {
            BigDecimal captured = capturedByCurr.getOrDefault(curr, BigDecimal.ZERO);
            BigDecimal refunded = refundedByCurr.getOrDefault(curr, BigDecimal.ZERO);
            netByCurr.put(curr, captured.subtract(refunded));
        }

        return new FinancialSummaryResponse(
                totalPayments,
                successful,
                failed,
                pending,
                capturedByCurr,
                refundedByCurr,
                netByCurr
        );
    }

    @Override
    public List<PaymentTrendItem> getPaymentTrends(String periodType, String currency, Instant startDate, Instant endDate) {
        List<Payment> payments = paymentRepository.findAll().stream()
                .filter(p -> p.getPaymentStatus() == PaymentStatus.CAPTURED)
                .filter(p -> currency == null || currency.isBlank() || p.getCurrency().equalsIgnoreCase(currency.trim()))
                .filter(p -> startDate == null || !p.getCreatedAt().isBefore(startDate))
                .filter(p -> endDate == null || !p.getCreatedAt().isAfter(endDate))
                .toList();

        boolean isMonth = "month".equalsIgnoreCase(periodType) || "monthly".equalsIgnoreCase(periodType);

        Map<String, List<Payment>> grouped = payments.stream().collect(Collectors.groupingBy(p -> {
            String periodKey = isMonth ? MONTH_FORMAT.format(p.getCreatedAt()) : DAY_FORMAT.format(p.getCreatedAt());
            return periodKey + "|" + p.getCurrency();
        }, TreeMap::new, Collectors.toList()));

        List<PaymentTrendItem> trends = new ArrayList<>();
        for (Map.Entry<String, List<Payment>> entry : grouped.entrySet()) {
            String[] parts = entry.getKey().split("\\|");
            String period = parts[0];
            String curr = parts[1];
            BigDecimal sum = entry.getValue().stream().map(Payment::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
            trends.add(new PaymentTrendItem(period, curr, sum, entry.getValue().size()));
        }

        return trends;
    }

    @Override
    public TransactionStatsResponse getTransactionStats(Instant startDate, Instant endDate) {
        List<PaymentTransaction> list = transactionRepository.findAll().stream()
                .filter(t -> startDate == null || !t.getCreatedAt().isBefore(startDate))
                .filter(t -> endDate == null || !t.getCreatedAt().isAfter(endDate))
                .toList();

        long total = list.size();
        long success = list.stream().filter(t -> t.getTransactionStatus() == TransactionStatus.SUCCESS).count();
        long failed = list.stream().filter(t -> t.getTransactionStatus() == TransactionStatus.FAILED).count();
        long pending = list.stream().filter(t -> t.getTransactionStatus() == TransactionStatus.PENDING).count();

        Map<String, Long> typeDist = list.stream()
                .collect(Collectors.groupingBy(t -> t.getTransactionType().name(), Collectors.counting()));

        return new TransactionStatsResponse(total, success, failed, pending, typeDist);
    }

    @Override
    public RefundStatsResponse getRefundStats(String currency, Instant startDate, Instant endDate) {
        List<Refund> refunds = refundRepository.findAll().stream()
                .filter(r -> startDate == null || !r.getCreatedAt().isBefore(startDate))
                .filter(r -> endDate == null || !r.getCreatedAt().isAfter(endDate))
                .filter(r -> currency == null || currency.isBlank() || (r.getPayment() != null && r.getPayment().getCurrency().equalsIgnoreCase(currency.trim())))
                .toList();

        long total = refunds.size();
        long completed = refunds.stream().filter(r -> r.getRefundStatus() == RefundStatus.COMPLETED).count();
        long pending = refunds.stream().filter(r -> r.getRefundStatus() == RefundStatus.PENDING).count();
        long failed = refunds.stream().filter(r -> r.getRefundStatus() == RefundStatus.FAILED).count();

        Map<String, BigDecimal> byCurrency = refunds.stream()
                .filter(r -> r.getRefundStatus() == RefundStatus.COMPLETED)
                .collect(Collectors.groupingBy(
                        r -> r.getPayment() != null ? r.getPayment().getCurrency() : "UNKNOWN",
                        Collectors.reducing(BigDecimal.ZERO, Refund::getRefundAmount, BigDecimal::add)
                ));

        return new RefundStatsResponse(total, completed, pending, failed, byCurrency);
    }

    @Override
    public ReconciliationStatsResponse getReconciliationStats() {
        long matched = 0;
        long amountMismatch = 0;
        long statusMismatch = 0;
        long missingInternal = 0;
        long missingExternal = 0;

        List<Object[]> groups = reconciliationRecordRepository.countByStatusGroup();
        for (Object[] row : groups) {
            ReconciliationStatus st = (ReconciliationStatus) row[0];
            long count = ((Number) row[1]).longValue();
            if (st == ReconciliationStatus.MATCHED) matched += count;
            else if (st == ReconciliationStatus.AMOUNT_MISMATCH) amountMismatch += count;
            else if (st == ReconciliationStatus.STATUS_MISMATCH) statusMismatch += count;
            else if (st == ReconciliationStatus.MISSING_INTERNAL) missingInternal += count;
            else if (st == ReconciliationStatus.MISSING_EXTERNAL) missingExternal += count;
        }

        long mismatched = amountMismatch + statusMismatch;
        long total = matched + mismatched + missingInternal + missingExternal;

        return new ReconciliationStatsResponse(
                total,
                matched,
                mismatched,
                amountMismatch,
                statusMismatch,
                missingInternal,
                missingExternal
        );
    }
}
