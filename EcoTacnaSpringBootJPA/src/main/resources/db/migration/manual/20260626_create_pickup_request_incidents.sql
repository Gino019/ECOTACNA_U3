CREATE TABLE IF NOT EXISTS pickup_request_incidents (
    id BIGSERIAL PRIMARY KEY,
    pickup_request_id BIGINT NOT NULL,
    reporter_company_id BIGINT NOT NULL,
    reporter_user_id BIGINT NOT NULL,
    reason_code VARCHAR(80) NOT NULL,
    reason_label VARCHAR(150) NOT NULL,
    custom_reason VARCHAR(255),
    description TEXT,
    status VARCHAR(30) NOT NULL DEFAULT 'REGISTRADA',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_pickup_request_incident_request
        FOREIGN KEY (pickup_request_id)
        REFERENCES pickup_requests(id),

    CONSTRAINT fk_pickup_request_incident_company
        FOREIGN KEY (reporter_company_id)
        REFERENCES companies(id),

    CONSTRAINT fk_pickup_request_incident_user
        FOREIGN KEY (reporter_user_id)
        REFERENCES users(id),

    CONSTRAINT pickup_request_incident_reason_check
        CHECK (
            reason_code IN (
                'RECOLECTOR_NO_LLEGO',
                'CANTIDAD_NO_COINCIDE',
                'NO_RECIBI_PAGO',
                'RECOJO_INCOMPLETO',
                'MALA_CONDUCTA',
                'PROBLEMA_HORARIO',
                'OTROS'
            )
        ),

    CONSTRAINT pickup_request_incident_status_check
        CHECK (
            status IN (
                'REGISTRADA',
                'REVISADA',
                'CERRADA'
            )
        )
);

CREATE INDEX IF NOT EXISTS idx_pickup_request_incidents_request
ON pickup_request_incidents(pickup_request_id);

CREATE INDEX IF NOT EXISTS idx_pickup_request_incidents_company
ON pickup_request_incidents(reporter_company_id);
