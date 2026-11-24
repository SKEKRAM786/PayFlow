package com.payflow.provider.impl;

import com.payflow.entity.Payment;
import com.payflow.provider.PaymentProvider;
import com.payflow.provider.ProviderPaymentResult;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Deterministic software simulator for financial transactions.
 * Rules for test scenarios:
 * - Amount equals 9999.00 triggers a simulated bank decline (INSUFFICIENT_FUNDS).
 * - Description containing "FAIL" triggers simulated network/gateway timeout.
 * - Otherwise produces successful deterministic provider authorization & capture.
 */
@Component
public class SimulatedPaymentProvider implements PaymentProvider {

    private static final Logger log = LoggerFactory.getLogger(SimulatedPaymentProvider.class);

    @Override
    public ProviderPaymentResult authorize(Payment payment) {
        log.info("[SIMULATOR] Processing authorization for paymentId={}, amount={} {}",
                payment.getId(), payment.getAmount(), payment.getCurrency());

        String simRef = "SIM-AUTH-" + UUID.randomUUID().toString().substring(0, 12).toUpperCase();

        if (payment.getAmount().compareTo(new BigDecimal("9999.00")) == 0) {
            log.warn("[SIMULATOR] Declining authorization: Insufficient funds trigger");
            return ProviderPaymentResult.failure(simRef, "51_INSUFFICIENT_FUNDS", "Simulated card decline: insufficient funds");
        }

        if (payment.getDescription() != null && payment.getDescription().toUpperCase().contains("FAIL")) {
            log.warn("[SIMULATOR] Declining authorization: Gateway reject trigger");
            return ProviderPaymentResult.failure(simRef, "96_SYSTEM_MALFUNCTION", "Simulated gateway error");
        }

        return ProviderPaymentResult.success(simRef, "Simulated authorization approved");
    }

    @Override
    public ProviderPaymentResult capture(Payment payment) {
        log.info("[SIMULATOR] Processing settlement capture for paymentId={}, amount={} {}",
                payment.getId(), payment.getAmount(), payment.getCurrency());

        String simRef = "SIM-CAP-" + UUID.randomUUID().toString().substring(0, 12).toUpperCase();
        return ProviderPaymentResult.success(simRef, "Simulated settlement capture successful");
    }

    @Override
    public ProviderPaymentResult cancel(Payment payment) {
        log.info("[SIMULATOR] Processing cancellation for paymentId={}", payment.getId());
        String simRef = "SIM-VOID-" + UUID.randomUUID().toString().substring(0, 12).toUpperCase();
        return ProviderPaymentResult.success(simRef, "Simulated authorization voided / cancelled");
    }

    @Override
    public ProviderPaymentResult refund(Payment payment, BigDecimal refundAmount, String refundReason) {
        log.info("[SIMULATOR] Processing refund for paymentId={}, amount={} {}, reason={}",
                payment.getId(), refundAmount, payment.getCurrency(), refundReason);

        String simRef = "SIM-REF-" + UUID.randomUUID().toString().substring(0, 12).toUpperCase();

        if (refundReason != null && refundReason.toUpperCase().contains("FAIL")) {
            log.warn("[SIMULATOR] Declining refund: Explicit refund failure trigger");
            return ProviderPaymentResult.failure(simRef, "54_REFUND_DECLINED", "Simulated refund bank rejection");
        }

        return ProviderPaymentResult.success(simRef, "Simulated refund successfully settled");
    }
}
