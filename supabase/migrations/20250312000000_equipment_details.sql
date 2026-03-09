BEGIN;

CREATE OR REPLACE FUNCTION get_commune_equipment_details(target_insee text)
RETURNS TABLE (
  domain char(1),
  domain_label text,
  equipment_label text,
  count bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    et.domain,
    et.domain_label,
    et.label,
    ce.nb::bigint
  FROM commune_equipments ce
  JOIN equipment_types et ON et.code = ce.typequ
  WHERE ce.insee = target_insee
    AND et.domain IN ('B', 'C', 'D', 'E', 'F')
  ORDER BY et.domain, ce.nb DESC, et.label;
END;
$$ LANGUAGE plpgsql STABLE;

COMMIT;
