WITH RECURSIVE meals AS (
	SELECT
		*
		FROM (
		VALUES
		(1, 60, 50, 0),
		(2, 120, 50, 0)
	) AS q (id, decay, amount, start)
), observed_carbs AS (
	SELECT
		generate_series(1, 500) as timestamp,
		1 as observed

), base AS (
	SELECT 
	  	*,
		1.0 * amount / decay as rate,
		1.0 * amount / decay / 1.5 as min_rate,
		start + decay as end
	FROM 
	  observed_carbs 
	LEFT JOIN meals on true
), attributed_carbs AS (
	SELECT * FROM (
		SELECT 
		timestamp, id, min_rate, amount, observed,
		observed * min_rate / SUM(active::int * min_rate) OVER () AS cumulative_attributed
		FROM base,
		LATERAL (
			SELECT timestamp > base.start AND timestamp < base.end as active
		)
		WHERE timestamp = 1
	)
	
	UNION ALL
	
	SELECT 
		c.timestamp,
		c.id,
		c.min_rate,
		c.amount,
		c.observed,
		CASE WHEN active THEN
			p.cumulative_attributed + 
			-- at least min rate
			-- TODO ois hirvee fantsuu ku vertailtais keskiarvoa viimeisimmistä eikä vain viimeisestä
			-- TODO ois hirvee fantsuu et jos ollaa tulevaisuudessa (ennusteessa) niin loppu menis GREATEST(havaittu, min_rate). mut se voi ehk olla erilline query selkeyden vuoks.
			GREATEST(c.min_rate, c.observed * c.min_rate / SUM (active::int * c.min_rate) OVER ())
		ELSE
			p.cumulative_attributed
		END AS cumulative_attributed
	FROM base c
	INNER JOIN attributed_carbs p ON p.timestamp + 1 = c.timestamp AND p.id = c.id,
	LATERAL (
		SELECT c.timestamp > c.start AND (c.timestamp < c.end OR (p.cumulative_attributed < c.amount AND c.timestamp < c.end + c.decay / 2)) AS active
	)
)

SELECT timestamp, SUM(amount - cumulative_attributed) as carbs_on_board FROM attributed_carbs GROUP BY timestamp ORDER BY timestamp
	

-- TOOD looks future, returns attributed after the timestamp
-- TODO if value depends on previous value we need to be careful which timestamp is the starting moment. We should pick a timestamp when there was no active meals for sure.