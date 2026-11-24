package com.payflow.repository;

import com.payflow.entity.PaymentTransaction;
import com.payflow.enums.TransactionStatus;
import com.payflow.enums.TransactionType;
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
public interface PaymentTransactionRepository extends JpaRepository<PaymentTransaction, UUID> {

    Optional<PaymentTransaction> findByTransactionReference(String transactionReference);

    boolean existsByTransactionReference(String transactionReference);

    List<PaymentTransaction> findByPaymentIdOrderByCreatedAtDesc(UUID paymentId);

    @Query("SELECT t FROM PaymentTransaction t WHERE " +
           "(:customerId IS NULL OR t.payment.customer.id = :customerId) AND " +
           "(:type IS NULL OR t.transactionType = :type) AND " +
           "(:status IS NULL OR t.transactionStatus = :status) AND " +
           "(:currency IS NULL OR t.currency = :currency) AND " +
           "(:startDate IS NULL OR t.createdAt >= :startDate) AND " +
           "(:endDate IS NULL OR t.createdAt <= :endDate) AND " +
           "(:search IS NULL OR LOWER(t.transactionReference) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(t.payment.paymentReference) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(t.payment.customer.fullName) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<PaymentTransaction> searchTransactions(
            @Param("customerId") UUID customerId,
            @Param("type") TransactionType type,
            @Param("status") TransactionStatus status,
            @Param("currency") String currency,
            @Param("startDate") Instant startDate,
            @Param("endDate") Instant endDate,
            @Param("search") String search,
            Pageable pageable
    );
}
