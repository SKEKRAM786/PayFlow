package com.payflow.service.impl;

import com.payflow.dto.response.AuditLogResponse;
import com.payflow.dto.response.DashboardStatsResponse;
import com.payflow.entity.AuditLog;
import com.payflow.entity.Payment;
import com.payflow.enums.PaymentStatus;
import com.payflow.enums.ReconciliationStatus;
import com.payflow.repository.*;
import com.payflow.service.DashboardService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Service
@Transactional(readOnly = true)
public class DashboardServiceImpl implements DashboardService {

    private final PaymentRepository paymentRepository;
    private final CustomerRepository customerRepository;
    private final RefundRepository refundRepository;
    private final ReconciliationRecordRepository reconciliationRecordRepository;
    private final AuditLogRepository auditLogRepository;

    public DashboardServiceImpl(PaymentRepository paymentRepository,
                                CustomerRepository customerRepository,
                                RefundRepository refundRepository,
                                ReconciliationRecordRepository reconciliationRecordRepository,
                                AuditLogRepository auditLogRepository) {
        this.paymentRepository = paymentRepository;
        this.customerRepository = customerRepository;
        this.refundRepository = refundRepository;
        this.reconciliationRecordRepository = reconciliationRecordRepository;
        this.auditLogRepository = auditLogRepository;
    }

    @Override
    public DashboardStatsResponse getDashboardStats() {
        List<Payment> allPayments = paymentRepository.findAll();
        long totalPayments = allPayments.size();
        long successfulPayments = allPayments.stream().filter(p -> p.getPaymentStatus() == PaymentStatus.CAPTURED).count();
        long pendingPayments = allPayments.stream().filter(p -> p.getPaymentStatus() == PaymentStatus.PENDING || p.getPaymentStatus() == PaymentStatus.AUTHORIZED).count();
        long failedPayments = allPayments.stream().filter(p -> p.getPaymentStatus() == PaymentStatus.FAILED).count();
        long cancelledPayments = allPayments.stream().filter(p -> p.getPaymentStatus() == PaymentStatus.CANCELLED).count();

        BigDecimal volumeUsd = allPayments.stream()
                .filter(p -> p.getPaymentStatus() == PaymentStatus.CAPTURED && "USD".equalsIgnoreCase(p.getCurrency()))
                .map(Payment::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal volumeInr = allPayments.stream()
                .filter(p -> p.getPaymentStatus() == PaymentStatus.CAPTURED && "INR".equalsIgnoreCase(p.getCurrency()))
                .map(Payment::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal volumeAed = allPayments.stream()
                .filter(p -> p.getPaymentStatus() == PaymentStatus.CAPTURED && "AED".equalsIgnoreCase(p.getCurrency()))
                .map(Payment::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        long totalCustomers = customerRepository.count();

        var allRefunds = refundRepository.findAll();
        long totalRefunds = allRefunds.size();
        BigDecimal totalRefundedAmount = allRefunds.stream()
                .map(r -> r.getRefundAmount())
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        long totalReconciled = 0;
        long totalDiscrepancies = 0;
        List<Object[]> statusCounts = reconciliationRecordRepository.countByStatusGroup();
        for (Object[] row : statusCounts) {
            ReconciliationStatus st = (ReconciliationStatus) row[0];
            long count = ((Number) row[1]).longValue();
            if (st == ReconciliationStatus.MATCHED) {
                totalReconciled += count;
            } else {
                totalDiscrepancies += count;
            }
        }

        return new DashboardStatsResponse(
                totalPayments,
                successfulPayments,
                pendingPayments,
                failedPayments,
                cancelledPayments,
                volumeUsd,
                volumeInr,
                volumeAed,
                totalCustomers,
                totalRefunds,
                totalRefundedAmount,
                totalReconciled,
                totalDiscrepancies
        );
    }

    @Override
    public Page<AuditLogResponse> getAuditLogs(String action, String entityType, UUID userId, Pageable pageable) {
        Page<AuditLog> page = auditLogRepository.findAll(pageable);
        List<AuditLogResponse> list = page.getContent().stream()
                .filter(a -> action == null || action.isBlank() || a.getAction().equalsIgnoreCase(action.trim()))
                .filter(a -> entityType == null || entityType.isBlank() || a.getEntityType().equalsIgnoreCase(entityType.trim()))
                .filter(a -> userId == null || (a.getUser() != null && a.getUser().getId().equals(userId)))
                .map(this::mapToResponse)
                .toList();

        return new PageImpl<>(list, pageable, page.getTotalElements());
    }

    private AuditLogResponse mapToResponse(AuditLog log) {
        return new AuditLogResponse(
                log.getId(),
                log.getUser() != null ? log.getUser().getId() : null,
                log.getUser() != null ? log.getUser().getEmail() : "SYSTEM",
                log.getAction(),
                log.getEntityType(),
                log.getEntityId(),
                log.getDescription(),
                log.getCorrelationId(),
                log.getCreatedAt()
        );
    }
}
