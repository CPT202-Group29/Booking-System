package com.cpt202.booking_system.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ThreadLocalRandom;

@Service
public class VerificationCodeService {

    private static final long TTL_MS = 5 * 60 * 1000; // 5 minutes
    private static final int CODE_LENGTH = 6;

    private final Map<String, CodeEntry> store = new ConcurrentHashMap<>();

    @Autowired(required = false)
    private JavaMailSender mailSender;

    public VerificationCodeService() {
        Thread cleaner = new Thread(() -> {
            while (true) {
                try {
                    Thread.sleep(60_000);
                    long now = System.currentTimeMillis();
                    store.entrySet().removeIf(e -> now > e.getValue().expiresAt);
                } catch (InterruptedException ignored) {
                    break;
                }
            }
        });
        cleaner.setDaemon(true);
        cleaner.start();
    }

    public String generateAndStore(String email) {
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < CODE_LENGTH; i++) {
            sb.append(ThreadLocalRandom.current().nextInt(0, 10));
        }
        String code = sb.toString();
        store.put(email.toLowerCase(), new CodeEntry(code, System.currentTimeMillis() + TTL_MS));

        // Always print to console
        System.out.println("========================================");
        System.out.println("  Verification code for " + email + ": " + code);
        System.out.println("========================================");

        // Send email if mailSender is configured
        if (mailSender != null) {
            try {
                SimpleMailMessage msg = new SimpleMailMessage();
                msg.setFrom("3237857983@qq.com");
                msg.setTo(email);
                msg.setSubject("[Expert Booking] Your Verification Code: " + code);
                msg.setText("Hello,\n\n"
                        + "Thank you for using Expert Booking System.\n\n"
                        + "Your 6-digit verification code is: " + code + "\n\n"
                        + "This code will expire in 5 minutes. Please enter it on the registration "
                        + "page to complete your sign-up.\n\n"
                        + "If you did not create an account with us, please ignore this message.\n\n"
                        + "Best regards,\n"
                        + "Expert Booking System Team");
                mailSender.send(msg);
                System.out.println("  Email sent to " + email);
            } catch (Exception e) {
                System.out.println("  Email send failed: " + e.getMessage());
                System.out.println("  Please use the code shown above.");
            }
        } else {
            System.out.println("  (Email service not configured, use code above)");
        }

        return code;
    }

    public boolean validate(String email, String code) {
        if (email == null || code == null) return false;
        CodeEntry entry = store.get(email.toLowerCase());
        if (entry == null) return false;
        if (System.currentTimeMillis() > entry.expiresAt) {
            store.remove(email.toLowerCase());
            return false;
        }
        return entry.code.equals(code.trim());
    }

    public void remove(String email) {
        store.remove(email.toLowerCase());
    }

    private static class CodeEntry {
        final String code;
        final long expiresAt;

        CodeEntry(String code, long expiresAt) {
            this.code = code;
            this.expiresAt = expiresAt;
        }
    }
}
