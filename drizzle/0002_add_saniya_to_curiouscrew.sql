-- One-off data fix: add Saniya Mahajan to team CuriousCrew (PAT-003), as the last member.
UPDATE "teams"
SET "members" = "members" || '[{"name": "Saniya Mahajan", "leader": false}]'::jsonb
WHERE "id" = 'PAT-003'
  AND "name" ILIKE 'curiouscrew'
  AND NOT EXISTS (
    SELECT 1 FROM jsonb_array_elements("members") m WHERE m->>'name' ILIKE 'saniya mahajan'
  );
