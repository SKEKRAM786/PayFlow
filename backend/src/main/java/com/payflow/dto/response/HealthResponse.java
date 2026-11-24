package com.payflow.dto.response;

import java.time.Instant;
import java.util.Map;

public record HealthResponse(
        String status,
        String service,
        String version,
        String environment,
        Instant timestamp,
        Map<String, Object> details
) {
    public static HealthResponse up(String service, String version, String environment, Map<String, Object> details) {
        return new HealthResponse("UP", service, version, environment, Instant.now(), details);
    }
}
