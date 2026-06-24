package com.GAKOM_ECOTACNA.ECOTACNA.security;

import com.auth0.jwt.JWT;
import com.auth0.jwt.JWTVerifier;
import com.auth0.jwt.algorithms.Algorithm;
import com.auth0.jwt.interfaces.DecodedJWT;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.Date;

@Component
public class JwtTokenProvider {

    @Value("${jwt.secret}")
    private String secretKey;

    @Value("${jwt.expiration}")
    private long validityInMilliseconds;

    /**
     * Genera un token JWT firmado usando HMAC-256.
     * Incluye id de empresa y nombre para facilitar la identificación
     * en el frontend y validaciones de seguridad B2B.
     */
    public String createToken(String email, String role, Long companyId, String companyName) {
        Date now = new Date();
        Date validity = new Date(now.getTime() + validityInMilliseconds);

        return JWT.create()
                .withSubject(email)
                .withClaim("role", role)
                .withClaim("companyId", companyId)
                .withClaim("companyName", companyName)
                .withIssuedAt(now)
                .withExpiresAt(validity)
                .sign(Algorithm.HMAC256(secretKey));
    }

    /**
     * Valida la firma y expiración de un token JWT.
     */
    public DecodedJWT validateToken(String token) {
        Algorithm algorithm = Algorithm.HMAC256(secretKey);
        JWTVerifier verifier = JWT.require(algorithm).build();
        return verifier.verify(token);
    }

    public String getEmail(DecodedJWT decodedJWT) {
        return decodedJWT.getSubject();
    }

    public String getRole(DecodedJWT decodedJWT) {
        return decodedJWT.getClaim("role").asString();
    }

    public Long getCompanyId(DecodedJWT decodedJWT) {
        return decodedJWT.getClaim("companyId").asLong();
    }

    public String getCompanyName(DecodedJWT decodedJWT) {
        return decodedJWT.getClaim("companyName").asString();
    }
}
