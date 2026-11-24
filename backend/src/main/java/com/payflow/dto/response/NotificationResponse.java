package com.payflow.dto.response;

import com.payflow.enums.NotificationType;

import java.time.Instant;
import java.util.UUID;

public record NotificationResponse(
        UUID id,
        UUID userId,
        String title,
        String message,
        NotificationType notificationType,
        boolean isRead,
        Instant createdAt
) {}
