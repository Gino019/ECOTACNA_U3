package com.GAKOM_ECOTACNA.ECOTACNA.service;

import com.GAKOM_ECOTACNA.ECOTACNA.dto.CaptchaResponseDto;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.imageio.ImageIO;
import java.awt.*;
import java.awt.geom.Path2D;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.util.Base64;
import java.util.Map;
import java.util.Random;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class CaptchaService {

    private static final Logger logger = LoggerFactory.getLogger(CaptchaService.class);

    static {
        // Asegurar que el entorno de AWT se ejecute sin interfaz gráfica (headless)
        System.setProperty("java.awt.headless", "true");
    }

    @Value("${captcha.enabled:true}")
    private boolean captchaEnabled;

    private final Map<String, CaptchaChallenge> activeChallenges = new ConcurrentHashMap<>();
    private final Random random = new Random();

    private static class CaptchaChallenge {
        final int targetX;
        final long expiryTime;
        boolean verified = false;
        boolean consumed = false;

        CaptchaChallenge(int targetX, long expiryTime) {
            this.targetX = targetX;
            this.expiryTime = expiryTime;
        }
    }

    public CaptchaResponseDto generateChallenge() {
        cleanExpiredChallenges();

        // 1. Generar la imagen de fondo con textura abstracta
        BufferedImage background = generateBackground();

        // 2. Definir dimensiones y posición aleatoria del corte del puzzle
        int pieceSize = 40;
        // targetX debe dejar espacio a la izquierda para poder deslizar y a la derecha para no salirse
        int targetX = 80 + random.nextInt(140); // 80 a 220
        int targetY = 20 + random.nextInt(90);  // 20 a 110

        // 3. Crear el path de la pieza de rompecabezas clásica
        Path2D.Double path = getJigsawPath(pieceSize);

        // 4. Crear la imagen transparente para la pieza de rompecabezas
        BufferedImage puzzlePiece = new BufferedImage(pieceSize, pieceSize, BufferedImage.TYPE_INT_ARGB);
        Graphics2D gPiece = puzzlePiece.createGraphics();
        gPiece.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
        gPiece.setClip(path);
        
        // Dibujar la porción correspondiente del fondo desplazada
        gPiece.drawImage(background, -targetX, -targetY, null);
        
        // Añadir borde blanco semi-transparente a la pieza
        gPiece.setStroke(new BasicStroke(2.0f));
        gPiece.setColor(new Color(255, 255, 255, 220));
        gPiece.draw(path);
        gPiece.dispose();

        // 5. Aplicar la silueta oscura (sombra del hueco) en la imagen de fondo
        Graphics2D gBg = background.createGraphics();
        gBg.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
        gBg.translate(targetX, targetY);
        
        // Pintar sombra oscura semi-transparente
        gBg.setColor(new Color(0, 0, 0, 180));
        gBg.fill(path);
        
        // Pintar contorno de la sombra
        gBg.setStroke(new BasicStroke(2.0f));
        gBg.setColor(new Color(0, 0, 0, 240));
        gBg.draw(path);
        gBg.dispose();

        // 6. Generar el token del desafío
        String challengeId = UUID.randomUUID().toString();
        // Guardar respuesta con expiración de 5 minutos
        activeChallenges.put(challengeId, new CaptchaChallenge(targetX, System.currentTimeMillis() + 300000));

        return CaptchaResponseDto.builder()
                .captchaToken(challengeId)
                .backgroundImage(toBase64Png(background))
                .puzzlePieceImage(toBase64Png(puzzlePiece))
                .y(targetY)
                .build();
    }

    public boolean verifyChallenge(String token, int userX) {
        if (!captchaEnabled) {
            return true;
        }

        if (token == null || token.trim().isEmpty()) {
            return false;
        }

        CaptchaChallenge challenge = activeChallenges.get(token);
        if (challenge == null) {
            logger.warn("El desafío del captcha no existe o ya fue consumido.");
            return false;
        }

        if (System.currentTimeMillis() > challenge.expiryTime) {
            logger.warn("El desafío del captcha ha expirado.");
            activeChallenges.remove(token);
            return false;
        }

        if (challenge.consumed || challenge.verified) {
            logger.warn("El token ya fue consumido o verificado previamente.");
            return false;
        }

        // Permitir un margen de error amigable de ±8 píxeles
        int diff = Math.abs(challenge.targetX - userX);
        if (diff <= 8) {
            challenge.verified = true;
            return true;
        } else {
            logger.warn("Verificación del captcha falló. Diff: {} píxeles", diff);
            return false;
        }
    }

    public boolean validateToken(String token) {
        if (!captchaEnabled) {
            return true;
        }

        if (token == null || token.trim().isEmpty()) {
            logger.warn("El token del captcha es nulo o vacío.");
            return false;
        }

        CaptchaChallenge challenge = activeChallenges.get(token);
        if (challenge == null) {
            logger.warn("El desafío del captcha no existe o ya fue consumido.");
            return false;
        }

        if (System.currentTimeMillis() > challenge.expiryTime) {
            logger.warn("El desafío del captcha ha expirado.");
            activeChallenges.remove(token);
            return false;
        }

        if (!challenge.verified) {
            logger.warn("El token no ha sido verificado por el usuario.");
            return false;
        }

        if (challenge.consumed) {
            logger.warn("El token ya fue consumido.");
            return false;
        }

        challenge.consumed = true;
        activeChallenges.remove(token);
        return true;
    }

    private BufferedImage generateBackground() {
        int width = 300;
        int height = 150;
        BufferedImage img = new BufferedImage(width, height, BufferedImage.TYPE_INT_RGB);
        Graphics2D g = img.createGraphics();
        g.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);

        // Gradiente de fondo moderno con colores ecológicos / frescos
        Color c1 = new Color(20, 160, 80);  // Verde EcoTacna
        Color c2 = new Color(15, 60, 110);  // Azul Marino oscuro
        GradientPaint gp = new GradientPaint(0, 0, c1, width, height, c2);
        g.setPaint(gp);
        g.fillRect(0, 0, width, height);

        // Pintar círculos y polígonos abstractos con transparencia para dar textura única
        for (int i = 0; i < 5; i++) {
            g.setColor(new Color(random.nextInt(256), random.nextInt(256), random.nextInt(256), 50 + random.nextInt(50)));
            int w = random.nextInt(80) + 40;
            int h = random.nextInt(80) + 40;
            int x = random.nextInt(width - w);
            int y = random.nextInt(height - h);
            if (random.nextBoolean()) {
                g.fillOval(x, y, w, h);
            } else {
                g.fillRect(x, y, w, h);
            }
        }
        g.dispose();
        return img;
    }

    private Path2D.Double getJigsawPath(int size) {
        Path2D.Double path = new Path2D.Double();
        double s = size;
        path.moveTo(0, 0);

        // Lado Superior: Pestaña hacia afuera
        path.lineTo(s / 3.0, 0);
        path.curveTo(s / 3.0, -s / 5.0, 2.0 * s / 3.0, -s / 5.0, 2.0 * s / 3.0, 0);
        path.lineTo(s, 0);

        // Lado Derecho: Pestaña hacia adentro (hendidura)
        path.lineTo(s, s / 3.0);
        path.curveTo(s - s / 5.0, s / 3.0, s - s / 5.0, 2.0 * s / 3.0, s, 2.0 * s / 3.0);
        path.lineTo(s, s);

        // Lado Inferior: Pestaña hacia afuera
        path.lineTo(2.0 * s / 3.0, s);
        path.curveTo(2.0 * s / 3.0, s + s / 5.0, s / 3.0, s + s / 5.0, s / 3.0, s);
        path.lineTo(0, s);

        // Lado Izquierdo: Pestaña hacia adentro (hendidura)
        path.lineTo(0, 2.0 * s / 3.0);
        path.curveTo(s / 5.0, 2.0 * s / 3.0, s / 5.0, s / 3.0, 0, s / 3.0);
        path.closePath();

        return path;
    }

    private String toBase64Png(BufferedImage img) {
        try (ByteArrayOutputStream os = new ByteArrayOutputStream()) {
            ImageIO.write(img, "png", os);
            byte[] bytes = os.toByteArray();
            return "data:image/png;base64," + Base64.getEncoder().encodeToString(bytes);
        } catch (Exception e) {
            throw new RuntimeException("Error al serializar imagen de captcha en Base64", e);
        }
    }

    private void cleanExpiredChallenges() {
        long now = System.currentTimeMillis();
        activeChallenges.entrySet().removeIf(entry -> now > entry.getValue().expiryTime);
    }
}
