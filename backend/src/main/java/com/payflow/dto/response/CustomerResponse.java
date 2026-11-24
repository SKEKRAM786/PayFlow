package com.payflow.dto.response;

import com.payflow.enums.CustomerStatus;

import java.time.Instant;
import java.util.UUID;

public record CustomerResponse(
        UUID id,
        String fullName,
        String email,
        String phoneNumber,
        CustomerStatus status,
        UUID userId,
        long paymentCount,
        Instant createdAt,
        Instant updatedAt
) {}
