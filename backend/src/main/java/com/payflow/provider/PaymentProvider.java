package com.payflow.provider;

import com.payflow.entity.Payment;

public interface PaymentProvider {
    ProviderPaymentResult authorize(Payment payment);
    ProviderPaymentResult capture(Payment payment);
    ProviderPaymentResult cancel(Payment payment);
    ProviderPaymentResult refund(Payment payment, java.math.BigDecimal refundAmount, String refundReason);
}
