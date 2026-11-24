package com.payflow.repository;

import com.payflow.entity.Payment;
import com.payflow.enums.PaymentStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, UUID> {

    Optional<Payment> findByIdempotencyKey(String idempotencyKey);

    boolean existsByIdempotencyKey(String idempotencyKey);

    Optional<Payment> findByPaymentReference(String paymentReference);

    Page<Payment> findByCustomerId(UUID customerId, Pageable pageable);

    @Query("SELECT p FROM Payment p WHERE " +
           "(:customerId IS NULL OR p.customer.id = :customerId) AND " +
           "(:status IS NULL OR p.paymentStatus = :status) AND " +
           "(:currency IS NULL OR p.currency = :currency) AND " +
           "(:reference IS NULL OR LOWER(p.paymentReference) LIKE LOWER(CONCAT('%', :reference, '%')) OR LOWER(p.idempotencyKey) LIKE LOWER(CONCAT('%', :reference, '%')))")
    Page<Payment> searchPayments(
            @Param("customerId") UUID customerId,
            @Param("status") PaymentStatus status,
            @Param("currency") String currency,
            @Param("reference") String reference,
            Pageable pageable
    );

    List<Payment> findByCreatedAtBetween(Instant start, Instant end);
}
