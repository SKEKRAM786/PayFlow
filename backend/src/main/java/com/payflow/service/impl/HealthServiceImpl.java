package com.payflow.service.impl;

import com.payflow.dto.response.HealthResponse;
import com.payflow.service.HealthService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.LinkedHashMap;
import java.util.Map;

@Service
public class HealthServiceImpl implements HealthService {

    @Value("${spring.application.name:payflow-backend}")
    private String applicationName;

    @Value("${payflow.version:1.0.0}")
    private String version;

    @Value("${spring.profiles.active:default}")
    private String activeProfile;

    @Override
    public HealthResponse getHealthStatus() {
        Map<String, Object> details = new LinkedHashMap<>();
        details.put("database", "PostgreSQL (Configured)");
        details.put("jvm", System.getProperty("java.version"));
        details.put("os", System.getProperty("os.name"));
        details.put("uptimeMillis", System.currentTimeMillis() - java.lang.management.ManagementFactory.getRuntimeMXBean().getStartTime());

        return HealthResponse.up(applicationName, version, activeProfile, details);
    }
}
