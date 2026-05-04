package com.cpt202.booking_system;

import com.cpt202.booking_system.entity.Expertise;
import com.cpt202.booking_system.entity.Specialist;
import com.cpt202.booking_system.repository.ExpertiseRepository;
import com.cpt202.booking_system.repository.SpecialistRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class BookingSystemApplicationTests {

    @Autowired
    private SpecialistRepository specialistRepository;

    @Autowired
    private ExpertiseRepository expertiseRepository;

    @Test
    void contextLoads() {
        // Verify Spring context starts successfully
    }

    @Test
    void testCreateSpecialist() {
        Specialist s = new Specialist();
        s.setName("Dr. Test");
        s.setExpertise("Psychology");
        s.setLevel("Senior");
        s.setFee(new BigDecimal("150.00"));
        s.setStatus(1);
        s.setContact("test@test.com");
        s.setDescription("Test specialist");

        Specialist saved = specialistRepository.save(s);
        assertNotNull(saved.getId());
        assertEquals("Dr. Test", saved.getName());
        assertEquals(1, saved.getStatus());
        assertEquals("Available", saved.getStatusText());
    }

    @Test
    void testFindAllSpecialists() {
        List<Specialist> specialists = specialistRepository.findAll();
        assertNotNull(specialists);
    }

    @Test
    void testCreateExpertise() {
        Expertise e = new Expertise();
        e.setExpertiseName("Test Category");
        e.setDescription("Test description");
        e.setStatus("Active");
        e.setUsedBy(0);

        Expertise saved = expertiseRepository.save(e);
        assertNotNull(saved.getId());
        assertEquals("Test Category", saved.getExpertiseName());
    }

    @Test
    void testFindAllExpertise() {
        List<Expertise> expertiseList = expertiseRepository.findAll();
        assertNotNull(expertiseList);
    }
}
