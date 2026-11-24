package com.payflow.provider;

import java.math.BigDecimal;

public record ProviderPaymentResult(
        boolean success,
        String providerReference,
        String responseCode,
        String message
) {
    public static ProviderPaymentResult success(String providerReference, String message) {
        return new ProviderPaymentResult(true, providerReference, "00_SUCCESS", message);
    }

    public static ProviderPaymentResult failure(String providerReference, String responseCode, String message) {
        return new ProviderPaymentResult(false, providerReference, responseCode, message);
    }
}
