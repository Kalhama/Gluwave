
from typing import List, Tuple
from datetime import datetime, timedelta

class Meal:
  id: int
  end: datetime
  extended_end: datetime
  rate: float
  carbs: float
  attributed_carbs: List[float]

class MealsOverTime:
  id: int
  timestamp: datetime
  rate: float
  carbs: float
  attributed_carbs: float

meals_over_time: List[Meal]

active_meals: List[Meal]

class Observation:
   timestamps: List[datetime]
   new_meals: List[Meal]
   observed_carbs: float

def find_comparison_step(datetimes: List[datetime], attributed_carbs: List[float], lookback_len: int) -> Tuple[datetime, float]:
  now = datetimes[0]
  d = zip(datetimes, attributed_carbs)
  for dt, value in d:
    if now - dt > timedelta(minutes=lookback_len):
      return (dt, value)
    
  # if no matches, return last
  i = min(len(datetimes), len(attributed_carbs))
  return (datetimes[i - 1], attributed_carbs[i - 1])


def minutes_between(x1: datetime, x2: datetime) -> float:
  return (x1 - x2).total_seconds() / 60.0

def is_active(ts: datetime, meal: Meal) -> bool:
  return ts < meal.end or ts < meal.extended_end and meal.attributed_carbs[0] < meal.carbs


def calculate_carbs_on_board(observations: List[Observation]):
  active_meals: List[Meal] = []  
  meals_over_time: List[Meal] = []  

  for observation in observations:    
    # Filter active meals on current observation time
    active_meals = [meal for meal in active_meals if is_active(observation.timestamps[0], meal)]

    # Calculate total rate of active meals
    total_rate = sum(meal['rate'] for meal in active_meals)

    for meal in active_meals:
      observed_attributed_carbs = (meal.rate / total_rate) * observation.observed_carbs + meal.attributed_carbs[0]

      # Get comparison data for attributed carbs over the last 30 minutes
      (dt, comparison_attributed) = find_comparison_step(observation.timestamps, meal.attributed_carbs, 30)
      min_attributed_carbs = comparison_attributed + minutes_between(dt, observation.timestamps[0]) * meal.rate / 1.5
      
      # Update attributed carbs with observed values
      meal.attributed_carbs.insert(0, min(meal.carbs, max(observed_attributed_carbs, min_attributed_carbs)))
    
    # Add new meals from the current observation to the active meals
    active_meals.append(observation.new_meals)
    meals_over_time.push(active_meals)

  return meals_over_time
    


