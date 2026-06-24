ALTER TABLE companies ADD COLUMN IF NOT EXISTS latitude NUMERIC(10,7);
ALTER TABLE companies ADD COLUMN IF NOT EXISTS longitude NUMERIC(10,7);

ALTER TABLE pickup_requests ADD COLUMN IF NOT EXISTS pickup_latitude NUMERIC(10,7);
ALTER TABLE pickup_requests ADD COLUMN IF NOT EXISTS pickup_longitude NUMERIC(10,7);

ALTER TABLE transport_units ADD COLUMN IF NOT EXISTS last_latitude NUMERIC(10,7);
ALTER TABLE transport_units ADD COLUMN IF NOT EXISTS last_longitude NUMERIC(10,7);
ALTER TABLE transport_units ADD COLUMN IF NOT EXISTS last_location_at TIMESTAMP;
