-- ============================================================
-- EcoTacna - Corrección de solicitudes huérfanas por incidencia
-- Fecha: 2026-06-23
--
-- Contexto:
-- Algunas solicitudes recibieron una incidencia antes de que el
-- backend actualizara automáticamente pickup_requests.status a CANCELADO.
--
-- Regla:
-- Toda solicitud con incidencia registrada y estado operativo activo
-- debe quedar CANCELADO para liberar al recolector y cerrar el flujo.
-- ============================================================


-- 1. Diagnóstico previo: solicitudes con incidencia pero aún activas
SELECT
    pr.id,
    pr.status,
    pr.company_id,
    pr.collector_user_id,
    pr.collector_id,
    pr.scheduled_at,
    COUNT(i.id) AS incident_count,
    MAX(i.created_at) AS latest_incident_at
FROM pickup_requests pr
JOIN pickup_request_incidents i
    ON i.pickup_request_id = pr.id
WHERE pr.status IN ('PROGRAMADO', 'EN_RUTA', 'EN_SITIO')
GROUP BY
    pr.id,
    pr.status,
    pr.company_id,
    pr.collector_user_id,
    pr.collector_id,
    pr.scheduled_at
ORDER BY pr.id DESC;


-- 2. Corrección: cancelar solicitudes activas que ya tienen incidencia
UPDATE pickup_requests SET status = 'CANCELADO'
WHERE status IN ('PROGRAMADO', 'EN_RUTA', 'EN_SITIO')
  AND EXISTS (
      SELECT 1
      FROM pickup_request_incidents i
      WHERE i.pickup_request_id = pickup_requests.id
  );


-- 3. Crear índice único para prevenir futuras incidencias duplicadas
CREATE UNIQUE INDEX IF NOT EXISTS ux_pickup_request_incidents_request
ON pickup_request_incidents (pickup_request_id);


-- 4. Verificación posterior: solicitudes con incidencia
SELECT
    pr.id,
    pr.status,
    pr.company_id,
    pr.collector_user_id,
    pr.collector_id,
    pr.scheduled_at,
    COUNT(i.id) AS incident_count,
    MAX(i.created_at) AS latest_incident_at
FROM pickup_requests pr
JOIN pickup_request_incidents i
    ON i.pickup_request_id = pr.id
GROUP BY
    pr.id,
    pr.status,
    pr.company_id,
    pr.collector_user_id,
    pr.collector_id,
    pr.scheduled_at
ORDER BY pr.id DESC;


-- 5. Verificación específica del caso observado
SELECT
    pr.id,
    pr.status,
    pr.company_id,
    pr.collector_user_id,
    pr.collector_id
FROM pickup_requests pr
WHERE pr.id = 40;

SELECT
    i.id,
    i.pickup_request_id,
    i.reason_code,
    i.reason_label,
    i.custom_reason,
    i.description,
    i.status,
    i.created_at
FROM pickup_request_incidents i
WHERE i.pickup_request_id = 40
ORDER BY i.created_at DESC;
