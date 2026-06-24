ALTER TABLE pickup_requests
DROP CONSTRAINT IF EXISTS pickup_requests_status_check;

ALTER TABLE pickup_requests
ADD CONSTRAINT pickup_requests_status_check
CHECK (
    status IN (
        'PENDIENTE',
        'PROGRAMADO',
        'EN_RUTA',
        'EN_SITIO',
        'RECOGIDO',
        'COMPLETADO',
        'CANCELADO'
    )
);
