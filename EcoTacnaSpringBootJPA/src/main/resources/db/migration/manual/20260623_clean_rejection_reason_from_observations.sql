-- Diagnóstico
SELECT id, observaciones
FROM pickup_requests
WHERE observaciones ILIKE '%| Motivo de rechazo:%';

-- Limpieza conservando texto previo
UPDATE pickup_requests
SET observaciones = trim(split_part(observaciones, '| Motivo de rechazo:', 1))
WHERE observaciones ILIKE '%| Motivo de rechazo:%';

-- Limpieza alternativa
UPDATE pickup_requests
SET observaciones = trim(split_part(observaciones, 'Motivo de rechazo:', 1))
WHERE observaciones ILIKE 'Motivo de rechazo:%';

-- Verificación
SELECT id, observaciones
FROM pickup_requests
WHERE observaciones ILIKE '%Motivo de rechazo:%';

-- 11. Garantizar una sola incidencia
CREATE UNIQUE INDEX IF NOT EXISTS ux_pickup_request_incidents_request
ON pickup_request_incidents (pickup_request_id);
