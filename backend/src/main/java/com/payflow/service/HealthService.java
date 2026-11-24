package com.payflow.service;

import com.payflow.dto.response.HealthResponse;

public interface HealthService {
    HealthResponse getHealthStatus();
}
