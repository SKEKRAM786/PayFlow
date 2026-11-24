package com.payflow.service;

import com.payflow.dto.response.AuditLogResponse;
import com.payflow.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.Instant;
import java.util.UUID;

public interface AuditService {
    void log(User user, String action, String entityType, UUID entityId, String description, String correlationId);
    void log(String action, String entityType, UUID entityId, String description);
    Page<AuditLogResponse> getAuditLogs(String action, String entityType, UUID userId, Instant startDate, Instant endDate, Pageable pageable);
    AuditLogResponse getAuditLogById(UUID id);
}
