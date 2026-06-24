package com.GAKOM_ECOTACNA.ECOTACNA.exception;

import com.GAKOM_ECOTACNA.ECOTACNA.dto.RegistrationStatusResponse;

public class DuplicateRegistrationException extends RuntimeException {

    private final RegistrationStatusResponse statusResponse;

    public DuplicateRegistrationException(String message, RegistrationStatusResponse statusResponse) {
        super(message);
        this.statusResponse = statusResponse;
    }

    public RegistrationStatusResponse getStatusResponse() {
        return statusResponse;
    }
}
