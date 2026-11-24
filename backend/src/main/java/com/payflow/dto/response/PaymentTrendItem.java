package com.payflow.dto.response;

import java.math.BigDecimal;
import java.util.List;

public record PaymentTrendItem(
        String period, // e.g., "2026-11-23" or "2026-W47" or "2026-11"
        String currency,
        BigDecimal volume,
        long count
) {}
