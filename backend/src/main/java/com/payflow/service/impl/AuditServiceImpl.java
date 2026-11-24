package com.payflow.service.impl;

import com.payflow.dto.response.AuditLogResponse;
import com.payflow.entity.AuditLog;
import com.payflow.entity.User;
import com.payflow.exception.ResourceNotFoundException;
import com.payflow.repository.AuditLogRepository;
import com.payflow.repository.UserRepository;
import com.payflow.security.UserPrincipal;
import com.payflow.service.AuditService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
public class AuditServiceImpl implements AuditService {

    private final AuditLogRepository auditLogRepository;
    private final UserRepository userRepository;

    public AuditServiceImpl(AuditLogRepository auditLogRepository, UserRepository userRepository) {
        this.auditLogRepository = auditLogRepository;
        this.userRepository = userRepository;
    }

    @Override
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void log(User user, String action, String entityType, UUID entityId, String description, String correlationId) {
        AuditLog auditLog = new AuditLog(user, action, entityType, entityId, sanitize(description), correlationId);
        auditLogRepository.save(auditLog);
    }

    @Override
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void log(String action, String entityType, UUID entityId, String description) {
        User user = resolveCurrentUser();
        String correlationId = UUID.randomUUID().toString();
        log(user, action, entityType, entityId, description, correlationId);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<AuditLogResponse> getAuditLogs(String action, String entityType, UUID userId, Instant startDate, Instant endDate, Pageable pageable) {
        Page<AuditLog> page = auditLogRepository.findAll(pageable);
        List<AuditLogResponse> list = page.getContent().stream()
                .filter(a -> action == null || action.isBlank() || a.getAction().equalsIgnoreCase(action.trim()))
                .filter(a -> entityType == null || entityType.isBlank() || a.getEntityType().equalsIgnoreCase(entityType.trim()))
                .filter(a -> userId == null || (a.getUser() != null && a.getUser().getId().equals(userId)))
                .filter(a -> startDate == null || !a.getCreatedAt().isBefore(startDate))
                .filter(a -> endDate == null || !a.getCreatedAt().isAfter(endDate))
                .map(this::mapToResponse)
                .toList();

        return new PageImpl<>(list, pageable, page.getTotalElements());
    }

    @Override
    @Transactional(readOnly = true)
    public AuditLogResponse getAuditLogById(UUID id) {
        AuditLog log = auditLogRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Audit log not found with ID: " + id));
        return mapToResponse(log);
    }

    private User resolveCurrentUser() {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.getPrincipal() instanceof UserPrincipal principal) {
                return userRepository.findById(principal.getId()).orElse(null);
            }
        } catch (Exception ignored) {}
        return null;
    }

    private String sanitize(String text) {
        if (text == null) return null;
        // Never log card numbers or passwords
        return text.replaceAll("(?i)(password|secret|token|card|cvv)=\\S+", "$1=***");
    }

    private AuditLogResponse mapToResponse(AuditLog log) {
        return new AuditLogResponse(
                log.getId(),
                log.getUser() != null ? log.getUser().getId() : null,
                log.getUser() != null ? log.getUser().getEmail() : "SYSTEM",
                log.getAction(),
                log.getEntityType(),
                log.getEntityId(),
                log.getDescription(),
                log.getCorrelationId(),
                log.getCreatedAt()
        );
    }
}
