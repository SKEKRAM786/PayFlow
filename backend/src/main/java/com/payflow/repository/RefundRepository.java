package com.payflow.repository;

import com.payflow.entity.Refund;
import com.payflow.enums.RefundStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface RefundRepository extends JpaRepository<Refund, UUID> {

    Optional<Refund> findByIdempotencyKey(String idempotencyKey);

    Optional<Refund> findByRefundReference(String refundReference);

    List<Refund> findByPaymentIdOrderByCreatedAtDesc(UUID paymentId);

    @Query("SELECT COALESCE(SUM(r.refundAmount), 0) FROM Refund r WHERE r.payment.id = :paymentId AND r.refundStatus IN ('COMPLETED', 'PENDING')")
    BigDecimal sumCommittedRefundsByPaymentId(@Param("paymentId") UUID paymentId);

    @Query("SELECT COALESCE(SUM(r.refundAmount), 0) FROM Refund r WHERE r.payment.id = :paymentId AND r.refundStatus = 'COMPLETED'")
    BigDecimal sumCompletedRefundsByPaymentId(@Param("paymentId") UUID paymentId);

    @Query("SELECT r FROM Refund r WHERE " +
           "(:customerId IS NULL OR r.payment.customer.id = :customerId) AND " +
           "(:status IS NULL OR r.refundStatus = :status) AND " +
           "(:currency IS NULL OR r.payment.currency = :currency) AND " +
           "(:startDate IS NULL OR r.createdAt >= :startDate) AND " +
           "(:endDate IS NULL OR r.createdAt <= :endDate) AND " +
           "(:search IS NULL OR LOWER(r.refundReference) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(r.payment.paymentReference) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Refund> searchRefunds(
            @Param("customerId") UUID customerId,
            @Param("status") RefundStatus status,
            @Param("currency") String currency,
            @Param("startDate") Instant startDate,
            @Param("endDate") Instant endDate,
            @Param("search") String search,
            Pageable pageable
    );
}
