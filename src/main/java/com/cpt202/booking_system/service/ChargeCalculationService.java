package com.cpt202.booking_system.service;

import com.cpt202.booking_system.entity.Specialist;
import com.cpt202.booking_system.repository.SpecialistRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;

@Service
public class ChargeCalculationService {

    private static final BigDecimal JUNIOR_RATE = new BigDecimal("50.00");
    private static final BigDecimal INTERMEDIATE_RATE = new BigDecimal("80.00");
    private static final BigDecimal SENIOR_RATE = new BigDecimal("120.00");

    @Autowired
    private SpecialistRepository specialistRepository;

    /** Tiered pricing by specialist level: Junior=50, Intermediate=80, Senior=120 */
    public BigDecimal calculateCharge(Long specialistId) {
        Specialist s = specialistRepository.findById(specialistId.intValue()).orElse(null);
        if (s == null) return JUNIOR_RATE;
        return getFeeByLevel(s.getLevel());
    }

    private BigDecimal getFeeByLevel(String level) {
        if (level == null) return JUNIOR_RATE;
        String l = level.toLowerCase().trim();
        if (l.contains("senior")) return SENIOR_RATE;
        if (l.contains("intermediate") || l.contains("mid")) return INTERMEDIATE_RATE;
        return JUNIOR_RATE;
    }

    /**
     * Tiered refund policy:
     *   >= 24h before appointment → 100% refund
     *   2h – 24h before appointment → 50% refund
     *   < 2h before appointment → 0% refund
     */
    public BigDecimal calculateRefund(BigDecimal chargeAmount, long hoursUntilAppointment) {
        if (hoursUntilAppointment >= 24) {
            return chargeAmount;
        } else if (hoursUntilAppointment >= 2) {
            return chargeAmount.multiply(new BigDecimal("0.5"))
                    .setScale(2, RoundingMode.HALF_UP);
        }
        return BigDecimal.ZERO;
    }
}
