package com.booking.service;

import com.booking.entity.Specialist;
import com.booking.repository.SpecialistRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.math.BigDecimal;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;

class ChargeCalculationServiceTest {

    @Mock
    private SpecialistRepository specialistRepository;

    private ChargeCalculationService chargeService;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        chargeService = new ChargeCalculationService(specialistRepository);
    }

    // ========== 正常值测试 ==========

    @Test
    void testJuniorFee() {
        Specialist junior = new Specialist();
        junior.setLevel("Junior");
        when(specialistRepository.findById(1)).thenReturn(Optional.of(junior));
        assertEquals(new BigDecimal("30.00"), chargeService.calculateCharge(1L));
    }

    @Test
    void testIntermediateFee() {
        Specialist intermediate = new Specialist();
        intermediate.setLevel("Intermediate");
        when(specialistRepository.findById(2)).thenReturn(Optional.of(intermediate));
        assertEquals(new BigDecimal("50.00"), chargeService.calculateCharge(2L));
    }

    @Test
    void testSeniorFee() {
        Specialist senior = new Specialist();
        senior.setLevel("Senior");
        when(specialistRepository.findById(3)).thenReturn(Optional.of(senior));
        assertEquals(new BigDecimal("80.00"), chargeService.calculateCharge(3L));
    }

    // ========== 边界值测试 ==========

    @Test
    void testFullRefund24hPlus() {
        // 距离预约时间 24 小时以上，应全退
        assertEquals(new BigDecimal("50.00"), chargeService.calculateRefund(24));
        assertEquals(new BigDecimal("50.00"), chargeService.calculateRefund(25));
    }

    @Test
    void testHalfRefund2hTo24h() {
        // 距离预约时间 2-24 小时，退 50%
        assertEquals(new BigDecimal("25.00"), chargeService.calculateRefund(2));
        assertEquals(new BigDecimal("25.00"), chargeService.calculateRefund(23));
    }

    @Test
    void testNoRefundUnder2h() {
        // 距离预约时间 < 2 小时，不退
        assertEquals(BigDecimal.ZERO, chargeService.calculateRefund(0));
        assertEquals(BigDecimal.ZERO, chargeService.calculateRefund(1));
    }

    // ========== 异常值测试 ==========

    @Test
    void testNullFeeForNonExistentLevel() {
        // 专家等级不在预定义范围内，应回退到默认费用 50.00
        Specialist unknown = new Specialist();
        unknown.setLevel("SuperSenior");
        when(specialistRepository.findById(99)).thenReturn(Optional.of(unknown));
        assertEquals(new BigDecimal("50.00"), chargeService.calculateCharge(99L));
    }

    @Test
    void testNullSpecialist() {
        // 专家不存在时，应回退到默认费用 50.00
        when(specialistRepository.findById(999)).thenReturn(Optional.empty());
        assertEquals(new BigDecimal("50.00"), chargeService.calculateCharge(999L));
    }

    @Test
    void testNullLevel() {
        // 专家的 level 字段为空时，应回退默认
        Specialist noLevel = new Specialist();
        noLevel.setLevel(null);
        when(specialistRepository.findById(10)).thenReturn(Optional.of(noLevel));
        assertEquals(new BigDecimal("50.00"), chargeService.calculateCharge(10L));
    }
}
