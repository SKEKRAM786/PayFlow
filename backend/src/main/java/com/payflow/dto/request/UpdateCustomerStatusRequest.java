package com.payflow.dto.request;

import com.payflow.enums.CustomerStatus;
import jakarta.validation.constraints.NotNull;

public record UpdateCustomerStatusRequest(
        @NotNull(message = "Status is required")
        CustomerStatus status
) {}
