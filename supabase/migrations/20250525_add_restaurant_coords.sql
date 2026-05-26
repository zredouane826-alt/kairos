-- Add GPS coordinates to restaurants table
-- Run this in Supabase Dashboard > SQL Editor

ALTER TABLE restaurants
  ADD COLUMN IF NOT EXISTS latitude  DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;

-- Seed approximate coordinates for existing restaurants by quartier
UPDATE restaurants SET latitude = 36.7539, longitude = 3.0427 WHERE LOWER(quartier) LIKE '%hydra%'          AND latitude IS NULL;
UPDATE restaurants SET latitude = 36.7900, longitude = 3.0573 WHERE LOWER(quartier) LIKE '%bab el oued%'    AND latitude IS NULL;
UPDATE restaurants SET latitude = 36.7614, longitude = 3.0364 WHERE LOWER(quartier) LIKE '%el biar%'        AND latitude IS NULL;
UPDATE restaurants SET latitude = 36.7625, longitude = 3.0521 WHERE LOWER(quartier) LIKE '%didouche%'       AND latitude IS NULL;
UPDATE restaurants SET latitude = 36.7700, longitude = 3.0500 WHERE LOWER(quartier) LIKE '%telemly%'        AND latitude IS NULL;
UPDATE restaurants SET latitude = 36.7611, longitude = 3.0157 WHERE LOWER(quartier) LIKE '%ben aknoun%'     AND latitude IS NULL;
UPDATE restaurants SET latitude = 36.7381, longitude = 3.0521 WHERE LOWER(quartier) LIKE '%bir mourad%'     AND latitude IS NULL;
UPDATE restaurants SET latitude = 36.7197, longitude = 3.1350 WHERE LOWER(quartier) LIKE '%el harrach%'     AND latitude IS NULL;
UPDATE restaurants SET latitude = 36.7669, longitude = 2.9605 WHERE LOWER(quartier) LIKE '%cheraga%'        AND latitude IS NULL;
UPDATE restaurants SET latitude = 36.7538, longitude = 3.0588 WHERE latitude IS NULL; -- fallback: Alger centre
