-- One-off data fix: put Swanandi Kawade back in team Nexus (PAT-005), in her original place (second).
UPDATE "teams"
SET "members" = jsonb_insert("members", '{1}', '{"name": "Swanandi Kawade", "leader": false}'::jsonb)
WHERE "id" = 'PAT-005'
  AND "name" ILIKE 'nexus'
  AND NOT EXISTS (
    SELECT 1 FROM jsonb_array_elements("members") m WHERE m->>'name' ILIKE 'swanandi%'
  );
