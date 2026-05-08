package com.booking.service;

import com.booking.entity.Specialist;
import com.booking.repository.SpecialistRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Map;
import java.util.Optional;

@Service
public class ChargeCalculationService {

    private static final BigDecimal DEFAULT_FEE = new BigDecimal("50.00");

    // 根据专家等级的动态费率
    private static final Map<String, BigDecimal> LEVEL_FEE = Map.of(
        "Junior", new BigDecimal("30.00"),
        "Intermediate", new BigDecimal("50.00"),
        "Senior", new BigDecimal("80.00")
    );

    private final SpecialistRepository specialistRepository;

    public ChargeCalculationService(SpecialistRepository specialistRepository) {
        this.specialistRepository = specialistRepository;
    }

    /** 根据专家 ID 计算咨询费用（默认按等级，否则回退默认值） */
    public BigDecimal calculateCharge(Long specialistId) {
        Optional<Specialist> opt = specialistRepository.findById(Math.toIntExact(specialistId));
        if (opt.isPresent()) {
            String level = opt.get().getLevel();
            if (level != null && LEVEL_FEE.containsKey(level)) {
                return LEVEL_FEE.get(level);
            }
        }
        return DEFAULT_FEE;
    }

    /** 按距离预约时间的剩余小时数计算退款比例 */
    public BigDecimal calculateRefund(long hoursUntilAppointment) {
        if (hoursUntilAppointment >= 24) {
            return calculateCharge(null); // 全退（取默认费用作为基数，但实际退款会基于订单金额）
        } else if (hoursUntilAppointment >= 2) {
            return new BigDecimal("25.00"); // 50%
        }
        return BigDecimal.ZERO;
    }
}
