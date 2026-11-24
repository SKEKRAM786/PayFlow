package com.payflow.service;

import com.payflow.dto.response.TransactionDetailResponse;
import com.payflow.enums.TransactionStatus;
import com.payflow.enums.TransactionType;
import com.payflow.security.UserPrincipal;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public interface TransactionService {
    Page<TransactionDetailResponse> getTransactions(
            TransactionType type,
            TransactionStatus status,
            String currency,
            Instant startDate,
            Instant endDate,
            String search,
            Pageable pageable,
            UserPrincipal principal
    );

    Page<TransactionDetailResponse> getTransactions(
            TransactionType type,
            TransactionStatus status,
            String currency,
            UUID customerId,
            Instant startDate,
            Instant endDate,
            String search,
            Pageable pageable,
            UserPrincipal principal
    );

    TransactionDetailResponse getTransactionById(UUID id, UserPrincipal principal);

    TransactionDetailResponse getTransactionByReference(String reference, UserPrincipal principal);

    List<TransactionDetailResponse> getTransactionsByPaymentId(UUID paymentId, UserPrincipal principal);
}
