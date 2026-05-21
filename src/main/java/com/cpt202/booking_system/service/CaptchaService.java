package com.cpt202.booking_system.service;

import org.springframework.stereotype.Service;

import javax.imageio.ImageIO;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.util.Base64;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ThreadLocalRandom;

@Service
public class CaptchaService {

    private static final int CAPTCHA_LENGTH = 4;
    private static final int WIDTH = 120;
    private static final int HEIGHT = 45;
    private static final long TTL_MS = 5 * 60 * 1000; // 5 minutes
    private static final String CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

    private final Map<String, CaptchaEntry> store = new ConcurrentHashMap<>();

    public CaptchaService() {
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

    public CaptchaResult generate() {
        String code = randomCode();
        BufferedImage image = renderImage(code);
        String base64 = encodeToBase64(image);

        String captchaId = UUID.randomUUID().toString().substring(0, 8);
        store.put(captchaId, new CaptchaEntry(code.toLowerCase(), System.currentTimeMillis() + TTL_MS));

        return new CaptchaResult(captchaId, "data:image/png;base64," + base64);
    }

    public boolean validate(String captchaId, String userInput) {
        if (captchaId == null || userInput == null) return false;
        CaptchaEntry entry = store.remove(captchaId); // one-time use
        if (entry == null) return false;
        if (System.currentTimeMillis() > entry.expiresAt) return false;
        return entry.code.equals(userInput.trim().toLowerCase());
    }

    private String randomCode() {
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < CAPTCHA_LENGTH; i++) {
            sb.append(CHARS.charAt(ThreadLocalRandom.current().nextInt(CHARS.length())));
        }
        return sb.toString();
    }

    private BufferedImage renderImage(String code) {
        BufferedImage image = new BufferedImage(WIDTH, HEIGHT, BufferedImage.TYPE_INT_RGB);
        Graphics2D g = image.createGraphics();

        // background
        g.setColor(new Color(240, 240, 245));
        g.fillRect(0, 0, WIDTH, HEIGHT);

        // noise lines
        g.setColor(new Color(180, 180, 190));
        for (int i = 0; i < 5; i++) {
            int x1 = ThreadLocalRandom.current().nextInt(WIDTH);
            int y1 = ThreadLocalRandom.current().nextInt(HEIGHT);
            int x2 = ThreadLocalRandom.current().nextInt(WIDTH);
            int y2 = ThreadLocalRandom.current().nextInt(HEIGHT);
            g.drawLine(x1, y1, x2, y2);
        }

        // characters
        g.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
        Font[] fonts = {
            new Font("Arial", Font.BOLD, 26),
            new Font("Arial", Font.ITALIC, 26),
            new Font("Serif", Font.BOLD, 26)
        };
        for (int i = 0; i < code.length(); i++) {
            g.setFont(fonts[ThreadLocalRandom.current().nextInt(fonts.length)]);
            g.setColor(new Color(
                ThreadLocalRandom.current().nextInt(40, 100),
                ThreadLocalRandom.current().nextInt(40, 120),
                ThreadLocalRandom.current().nextInt(40, 120)));
            int x = 10 + i * 26 + ThreadLocalRandom.current().nextInt(-3, 4);
            int y = 28 + ThreadLocalRandom.current().nextInt(-5, 6);
            double angle = Math.toRadians(ThreadLocalRandom.current().nextInt(-20, 21));
            g.rotate(angle, x, y);
            g.drawString(String.valueOf(code.charAt(i)), x, y);
            g.rotate(-angle, x, y);
        }

        // dots
        for (int i = 0; i < 20; i++) {
            int x = ThreadLocalRandom.current().nextInt(WIDTH);
            int y = ThreadLocalRandom.current().nextInt(HEIGHT);
            image.setRGB(x, y, new Color(100, 100, 120).getRGB());
        }

        g.dispose();
        return image;
    }

    private String encodeToBase64(BufferedImage image) {
        try {
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            ImageIO.write(image, "png", baos);
            return Base64.getEncoder().encodeToString(baos.toByteArray());
        } catch (Exception e) {
            throw new RuntimeException("Failed to encode captcha image", e);
        }
    }

    // === inner types ===

    public static class CaptchaResult {
        public final String captchaId;
        public final String captchaImage;

        CaptchaResult(String captchaId, String captchaImage) {
            this.captchaId = captchaId;
            this.captchaImage = captchaImage;
        }
    }

    private static class CaptchaEntry {
        final String code;
        final long expiresAt;

        CaptchaEntry(String code, long expiresAt) {
            this.code = code;
            this.expiresAt = expiresAt;
        }
    }
}
