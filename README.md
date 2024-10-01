<img alt="Gluwve" src="gluwave/public/full_transparent.png">

## Features 🚀
- [x] Smart glucose [prediction algorithm](https://github.com/Kalhama/Gluwave?tab=readme-ov-file#algorithm-)
- [x] Integrate glucose from Freestyle Libre 2 / 3, or manually input fingerprick results
- [x] Calculate insulin on board
- [x] Log meals

## Demo 🎥

Public instance is available for anyone at https://gluwave.com

## How to use Gluwave 🛠️

Using Gluwave is simple with following steps

### Configure settings

Update your carbohydrate ratio and correction ratio in the settings

<img src="./images/settings.png" width="70%">

### Adding entries (glucose, carbohydrate and insulin)

You can add new glucose, carbohydrate and insulin entries from the bottom toolbar.

**Example of adding new meal entry:**

1. When was the meal
2. How big was the meal in carbs
3. How long do you expect your body to absorb the meal

<img src="./images/add-carbs.png" width="40%">

### Main screen

Main screen is split into three sections:

#### Glucose

First of them is historical glucose and predictions.

<img src="./images/blood-glucose.png" width="50%">

You can see more detailed prediction when you click "Eventually -.- mmmol/l"

#### Insulin

Second section is for insulin on board. Again you can view and edit the insulin entries by clicking the `IOB X U` on top right.

<img src="./images/insulin.png" width="50%">

> [!WARNING]  
> All insulin is assumed to be Fiasp. [Open an issue](https://github.com/Kalhama/gluwave/issues) for new insulin types

#### Carbohydrates

Final section is about your daily carbs and how they have been absorbed over time.

<img src="./images/carbs.png" width="50%">

If you view the list of carbs you can see how much carbs we actually observed

<img src="./images/carbs-list.png" width="50%">

## Algorithm 📊

<img src="./images/prediction.png" width="50%">

The algorithm predicts future blood glucose levels based on three factors:

1. **Last Known Blood Glucose**: This is the most recent measurement of blood glucose. It serves as the starting point for future predictions.

2. **Remaining Carbs**: This represents the amount of carbohydrates from a meal that has not yet been absorbed.

   - It is calculated by taking the total carbs, and reducing the amount already absorbed. However, the amount already observed is always increased at minimum absorption speed, to ensure that all meals fade out in appropiate time.
   - For remaining carbs, the absorption rate is assumed to continue at the recently observed pace, or at the minimum rate, whichever is higher.
     - $rate_{min} = \frac{carbs_{reported}}{decay}\frac{2}{3}$
   - If there are multiple meals, the algorithm tracks and calculates the remaining carbs for each one individually based on their reported absorption rate.

3. **Remaining Insulin**: This indicates the amount of active insulin in the body and its anticipated reduction over time.
   - Insulin activity diminishes gradually, following a known decay profile based on the type and doses administered.

The algorithm combines these three factors to predict future blood glucose levels. It does this by:

- Estimating how remaining carbs will raise blood glucose as they continue to absorb.
- Accounting for how remaining insulin will lower blood glucose as it decays.

The final prediction is a balance of these opposing effects, providing an estimate of blood glucose levels over time. You can see all three factors in the prediction graph, where

- green is the prediction without any insulin
- red is prediction without any food
- gray is the actual prediction considering both factors

## Integrating with Freestyle Libre 2 / 3 📡

If you want to integrate Freestyle Libre into the app you need to run the piece of integration yourself. The documentation for that is covered in here: [Github - librelinkup-to-iob-calculator](https://github.com/Kalhama/gluwave/tree/master/librelinkup-to-gluwave)

## Credits 🙏

Big credits to folks at Loop. I have shamelessly copied many of their achievements and concepts.

## Self hosting with docker-compose 🐳

1. `mkdir gluwave && cd gluwave`
2. `wget -O docker-compose.yml https://github.com/Kalhama/gluwave/blob/master/gluwave/docker-compose.yml`
3. Put following to `.env`

```shell
#gluwve
DATABASE_URL=postgresql://postgres:pass@postgres:5432/gluwave?schema=public
DATABASE_URL_UNPOOLED=postgresql://postgres:pass@postgres:5432/gluwave?schema=public
GITHUB_ID=_
GITHUB_SECRET=_
# Get secret and id from: github -> settings -> developer settings -> OAuth Apps -> New OAuth Apps

#postgres, make sure these match with the conn url above
POSTGRES_PASSWORD=pass
POSTGRES_USER=postgres
POSTGRES_DB=gluwave
POSTGRES_DATA_DIR=./db
```

4. `docker compose up -d`

## Technology stack 💻

- Framework: [Next.js](https://nextjs.org/docs)
- ORM and database: Drizzle + postgres
- Forms: [react-hook-form](https://react-hook-form.com/)
- (Form) validation: [zod](https://github.com/colinhacks/zod)
- Styles: [tailwindcss](https://tailwindcss.com/), sass, normalize.css
- UI libraries: [shadcn/ui](https://ui.shadcn.com/)
- Icons: [lucide-react](https://lucide.dev/icons/)
- Linter: ESLint
- Formatter: Prettier
- Misc:
  - Axios
  - [react-datepicker](https://reactdatepicker.com/)
  - [@tanstack/react-table](https://tanstack.com/table/latest)
  - and other at [package.json](./nextjs/package.json)
- Authorization: [lucia-auth](https://lucia-auth.com/)

## Bug reports, feature requests, support 🐞

Please fill a new [Github issuse](https://github.com/Kalhama/gluwave/issues)

## Contact 📬

If you want to reach me personally you can reach me via mail [max@kalhama.fi](mailto:max@kalhama.fi)
