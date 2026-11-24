package com.payflow.service;

import com.payflow.dto.request.CreateRefundRequest;
import com.payflow.dto.response.RefundResponse;
import com.payflow.dto.response.RefundableBalanceResponse;
import com.payflow.enums.RefundStatus;
import com.payflow.security.UserPrincipal;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public interface RefundService {
    RefundResponse processRefund(UUID paymentId, CreateRefundRequest request, UserPrincipal principal);
    RefundableBalanceResponse getRefundableBalance(UUID paymentId, UserPrincipal principal);
    RefundResponse getRefundById(UUID refundId, UserPrincipal principal);
    List<RefundResponse> getRefundsByPaymentId(UUID paymentId, UserPrincipal principal);
    Page<RefundResponse> getRefunds(RefundStatus status, String currency, Instant startDate, Instant endDate, String search, Pageable pageable, UserPrincipal principal);
}
