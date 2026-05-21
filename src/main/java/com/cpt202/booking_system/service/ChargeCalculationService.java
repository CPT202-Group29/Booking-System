package com.cpt202.booking_system.service;

import com.cpt202.booking_system.entity.Specialist;
import com.cpt202.booking_system.repository.SpecialistRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;

@Service
public class ChargeCalculationService {

    private static final BigDecimal FLAT_RATE = new BigDecimal("50.00");

    @Autowired
    private SpecialistRepository specialistRepository;

    public BigDecimal calculateCharge(Long specialistId) {
        return specialistRepository.findById(specialistId)
            .map(specialist -> specialist.getFee())
            .orElse(FLAT_RATE);
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