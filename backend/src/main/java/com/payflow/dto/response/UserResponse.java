package com.payflow.dto.response;

import java.time.Instant;
import java.util.UUID;

public record UserResponse(
        UUID id,
        String fullName,
        String email,
        String role,
        boolean enabled,
        Instant createdAt
) {}
