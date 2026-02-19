# Time Progress

A responsive single-page web application that visualizes the passing of time. It shows current time units (year, month, week, day, hour) with progress bars and precise percentages, plus a **Life** view: a visual grid of every day of your life from birth to expected lifespan.

**Live app:** [https://andrew-voronin.github.io/voroninpy.github.io/](https://andrew-voronin.github.io/voroninpy.github.io/)

## Features

- Displays current year, month, week, day, and hour with progress bars and 8-decimal percentages
- **Four modes:** Absolute, Active, Work, and Life — click anywhere to cycle
- **Life mode:** Set your date of birth and expected lifespan; view a day-by-day grid of your life with customizable life phases (e.g. Childhood, Adolescence, Young Adult, etc.)
- Responsive layout; optimized for iPad Safari in portrait
- Dynamic animations; no scrolling — content fits the viewport
- Random time-related quotes (hidden in Life mode)
- Development mode for testing and time simulation

## Time Modes

| Mode      | Description                                              | Window                                       |
|-----------|----------------------------------------------------------|----------------------------------------------|
| ABSOLUTE  | Calendar time progress (default)                         | Full 24 hours (00:00–23:59)                  |
| ACTIVE    | Progress during active/waking hours                      | 07:00–22:00 (customizable in `config.js`)   |
| WORK      | Progress during work hours (weekdays only)               | 08:00–20:00 (customizable in `config.js`)   |
| LIFE      | Progress through your life from birth; day grid + phases | From DOB to expected lifespan               |

Time-window settings for Active and Work are in `config.js`. Life settings (DOB, lifespan, phase boundaries) are set in the in-app modal and stored in `localStorage`.

## Usage

1. Open [https://andrew-voronin.github.io/voroninpy.github.io/](https://andrew-voronin.github.io/voroninpy.github.io/)
2. For best experience, use on an iPad in portrait mode
3. Click anywhere to cycle between Absolute → Active → Work → Life
4. In Life mode, use **Set date of birth** (or long-press the Life progress area) to open the config modal: set DOB, expected lifespan (50–200 years), and life phase age boundaries
5. Optional: add `?mode=absolute|active|work|life` to the URL to start in a specific mode

## Development Mode

The application includes a development mode for testing and debugging:

- Set `DEV_MODE_ENABLED` to `true` in `config.js` to enable
- When enabled, development controls appear at the bottom of the screen
- Features include:
  - Set custom date and time for testing
  - Enable debug mode for detailed progress calculations
  - Reset to system time
  - View detailed calculation logs in the browser console

To disable development mode for production, set `DEV_MODE_ENABLED` to `false` in `config.js`.

## Technical Details

- Pure HTML, CSS, and JavaScript
- No external dependencies
- Responsive design that adapts to different screen sizes
- Real-time calculations of time progress with high precision
- Visual effects to emphasize the passage of time