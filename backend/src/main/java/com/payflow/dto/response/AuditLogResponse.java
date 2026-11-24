package com.payflow.dto.response;

import java.time.Instant;
import java.util.UUID;

public record AuditLogResponse(
        UUID id,
        UUID userId,
        String userEmail,
        String action,
        String entityType,
        UUID entityId,
        String description,
        String correlationId,
        Instant createdAt
) {}
