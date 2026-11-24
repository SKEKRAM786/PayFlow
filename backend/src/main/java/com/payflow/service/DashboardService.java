package com.payflow.service;

import com.payflow.dto.response.AuditLogResponse;
import com.payflow.dto.response.DashboardStatsResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface DashboardService {
    DashboardStatsResponse getDashboardStats();
    Page<AuditLogResponse> getAuditLogs(String action, String entityType, UUID userId, Pageable pageable);
}
