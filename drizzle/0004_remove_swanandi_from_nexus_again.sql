-- One-off data fix: remove Swanandi Kawade from team Nexus (PAT-005) again.
-- Keeps the other members, their order (team lead first) and any check-in times.
UPDATE "teams"
SET "members" = COALESCE((
  SELECT jsonb_agg(m ORDER BY i)
  FROM jsonb_array_elements("members") WITH ORDINALITY AS t(m, i)
  WHERE m->>'name' NOT ILIKE 'swanandi%'
), '[]'::jsonb)
WHERE "id" = 'PAT-005' AND "name" ILIKE 'nexus';
