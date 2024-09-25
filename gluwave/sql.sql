CREATE OR REPLACE FUNCTION is_close(t timestamp without time zone, end_time timestamp without time zone, lagging_cumulative_attributed_carbs double precision, carbs integer)
   returns boolean 
   language plpgsql
  AS
$$
BEGIN
    return t > end_time AND lagging_cumulative_attributed_carbs >= carbs;
END;
$$;

WITH RECURSIVE carbs_join_observed (
    SELECT
        timeframe.timestamp AS timestamp,
        LEAD(timeframe.timestamp) AS next_timestamp,
        carbs.timestamp AS start_time,
        carbs.timestamp + MAKE_INTERVAL(mins => carbs.decay) AS end_time,
        id,
        amount AS carbs,
        decay,
        amount / decay / 1.5 AS min_rate,
        observed_carbs
    FROM 
        timeframe
    LEFT JOIN carbs
        ON timeframe.timestamp >= carbs.timestamp
        AND timeframe.timestamp <= carbs.timestamp + MAKE_INTERVAL(mins => (carbs.decay * 1.5)::int)
    LEFT JOIN observed_carbs
        ON timeframe.timestamp = observed_carbs.timestamp
), carbs_assign_observed (
    -- genessis
    SELECT 
        timestamp - interval '1 minutes' as timestamp,
        1 AS row_number
        timestamp as next_timestamp,
        -1 AS id,
        null AS carbs,
        null AS decay,
        null AS min_rate,
        0 AS observed_carbs,
        0 AS total_min_rate,
        0 AS attributed_carbs
        FROM carbs_join_observed
        ORDER BY timestamp ASC
        LIMIT 1

    UNION ALL
        timestamp,
        ROW_NUMBER() AS row_number
        next_timestamp,
        id,
        carbs,
        decay,
        carbs / decay / 1.5 AS min_rate,

        SUM(CASE 
            is_closed(
                t => c.timestamp,
                end_time => c.end_time,
                lagging_cumulative_attributed_carbs => SUM(r.attributed_carbs) OVER (
                    PARTITION BY r.id 
                ),
                carbs => c.carbs
            ) 
            THEN c.min_rate 
            ELSE 0 
        END) OVER (PARTITION BY timestamp) AS total_min_rate,
        
        -- attributed carbs to this meal at this timestamp
        CASE WHEN 
            is_closed(
                t => c.timestamp,
                end_time => c.end_time,
                lagging_cumulative_attributed_carbs => SUM(r.attributed_carbs) OVER (
                    PARTITION BY r.id 
                ),
                carbs => c.carbs
            ) 
        THEN
            0
        ELSE
            c.min_rate / c.total_min_rate * c.observed_carbs
        END AS attributed_carbs
    FROM
        carbs_join_observed c
    -- join self
    WHERE GREATEST(r.next_timestamp) = c.timstamp AND r.row_number = 1
)

SELECT
    timestamp
    -- TODO GREATEST(attributed_carbs, min_rate)
    SUM(carbs - attributed_carbs) AS carbs_on_board
GROUP BY timestamp
ORDER BY timestamp
