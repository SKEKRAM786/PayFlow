package com.payflow.dto.response;

import java.math.BigDecimal;
import java.util.UUID;

public record RefundableBalanceResponse(
        UUID paymentId,
        String paymentReference,
        BigDecimal totalCapturedAmount,
        BigDecimal totalRefundedAmount,
        BigDecimal remainingRefundableAmount,
        String currency
) {}
