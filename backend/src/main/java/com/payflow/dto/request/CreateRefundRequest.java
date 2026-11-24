package com.payflow.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record CreateRefundRequest(
        @NotNull(message = "Refund amount is required")
        @DecimalMin(value = "0.01", message = "Refund amount must be strictly greater than zero")
        BigDecimal amount,

        @NotBlank(message = "Refund reason is required")
        @Size(max = 255, message = "Reason cannot exceed 255 characters")
        String reason,

        @NotBlank(message = "Idempotency key is required")
        @Size(min = 8, max = 120, message = "Idempotency key must be between 8 and 120 characters")
        String idempotencyKey
) {}
