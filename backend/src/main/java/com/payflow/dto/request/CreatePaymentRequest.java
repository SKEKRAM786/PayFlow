package com.payflow.dto.request;

import com.payflow.enums.PaymentMethod;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.util.UUID;

public record CreatePaymentRequest(
        @NotNull(message = "Customer ID is required")
        UUID customerId,

        @NotNull(message = "Amount is required")
        @DecimalMin(value = "0.01", message = "Payment amount must be greater than zero")
        BigDecimal amount,

        @NotBlank(message = "Currency is required")
        @Pattern(regexp = "^(INR|USD|AED)$", message = "Currency must be one of: INR, USD, AED")
        String currency,

        @NotNull(message = "Payment method is required")
        PaymentMethod paymentMethod,

        @NotBlank(message = "Idempotency key is required")
        @Size(min = 8, max = 120, message = "Idempotency key must be between 8 and 120 characters")
        String idempotencyKey,

        @Size(max = 255, message = "Description cannot exceed 255 characters")
        String description
) {}
