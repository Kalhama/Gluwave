CREATE VIEW public."metrics"
 AS

 WITH glucose_rate AS (
         SELECT glucose.id AS glucose_id,
            glucose.user_id,
            glucose."timestamp",
            glucose.amount AS glucose,
            COALESCE(lead(glucose.amount) OVER (PARTITION BY glucose.user_id ORDER BY glucose."timestamp") - glucose.amount, 0::double precision) AS glucose_change,
            lead(glucose."timestamp") OVER (PARTITION BY glucose.user_id ORDER BY glucose."timestamp") - glucose."timestamp" AS step
           FROM glucose
        ), insulin_rate AS (
         SELECT unnamed_subquery.glucose_id,
            unnamed_subquery.total_insulin_absorbed,
            lead(unnamed_subquery.total_insulin_absorbed) OVER (PARTITION BY unnamed_subquery.user_id ORDER BY unnamed_subquery."timestamp") - unnamed_subquery.total_insulin_absorbed AS insulin_absorbed
           FROM ( SELECT glucose.user_id,
                    glucose."timestamp",
                    glucose.id AS glucose_id,
                    COALESCE(sum(total_insulin_absorbed(t => glucose."timestamp", start => insulin."timestamp", amount => insulin.amount)), 0::numeric) AS total_insulin_absorbed
                   FROM glucose
                     LEFT JOIN insulin ON glucose.user_id = insulin.user_id AND insulin."timestamp" <= glucose."timestamp"
                  GROUP BY glucose.id) unnamed_subquery
        )
 SELECT glucose_rate.glucose_id,
    lead(glucose_rate.glucose_id) OVER (PARTITION BY glucose_rate.user_id ORDER BY glucose_rate."timestamp") AS next_glucose_id,
    glucose_rate.user_id,
    glucose_rate."timestamp",
    glucose_rate.glucose,
    glucose_rate.glucose_change,
    glucose_rate.step,
    insulin_rate.total_insulin_absorbed,
    COALESCE(glucose_rate.glucose_change / "user"."correctionRatio" * "user"."carbohydrateRatio" + insulin_rate.insulin_absorbed::double precision * "user"."carbohydrateRatio", 0::double precision) AS observed_carbs
   FROM glucose_rate
     LEFT JOIN insulin_rate ON insulin_rate.glucose_id = glucose_rate.glucose_id
     LEFT JOIN "user" ON "user".id = glucose_rate.user_id
  ORDER BY glucose_rate."timestamp";