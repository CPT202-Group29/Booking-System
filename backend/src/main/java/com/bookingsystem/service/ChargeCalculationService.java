package com.bookingsystem.service;

import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;

/**
 * Handles automatic charge calculation based on pricing rules.
 * Default: flat rate pricing. Extensible for future specialist-level-based pricing.
 */
@Service
public class ChargeCalculationService {

    private static final BigDecimal FLAT_RATE = new BigDecimal("50.00");

    public BigDecimal calculateCharge(Long specialistId) {
        return FLAT_RATE;
    }

    public BigDecimal calculateRefund(long hoursUntilAppointment) {
        if (hoursUntilAppointment >= 24) {
            return FLAT_RATE;
        } else if (hoursUntilAppointment >= 2) {
            return FLAT_RATE.multiply(new BigDecimal("0.5"))
                    .setScale(2, RoundingMode.HALF_UP);
        }
        return BigDecimal.ZERO;
    }
}
