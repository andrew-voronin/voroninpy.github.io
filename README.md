# Time Progress

A responsive single-page web application that visualizes the passing of time. It shows current time units (year, month, week, day, hour) with progress bars and precise percentages, plus a **Life** view: a visual grid of every day of your life from birth to expected lifespan.

**Live app:** [https://andrew-voronin.github.io/voroninpy.github.io/](https://andrew-voronin.github.io/voroninpy.github.io/)

## Features

- Displays current year, month, week, day, and hour with progress bars and 8-decimal percentages
- **Eight modes:** Absolute, Absolute - Today, Active, Active - Today, Work, Work - Today, Life, and Life - Current Phase — click anywhere to cycle
- **Today modes:** After each base mode, a day-grid view shows progress through today's available hours only (Monday shows Monday's window, etc.), with a rainbow hour map and smooth color transitions
- **Life mode:** Set your date of birth and expected lifespan; view a day-by-day grid of your life with customizable life phases (e.g. Childhood, Adolescence, Young Adult, etc.)
- **Life - Current Phase mode:** Same layout as Life, but the grid and percentage cover only your current life phase (from phase start to phase end)
- Responsive layout; optimized for iPad Safari in portrait
- Dynamic animations; no scrolling — content fits the viewport
- Random time-related quotes (hidden in Life and Today modes)
- Development mode for testing and time simulation

## Time Modes

| Mode      | Description                                              | Window                                       |
|-----------|----------------------------------------------------------|----------------------------------------------|
| ABSOLUTE  | Calendar time progress (default)                         | Full 24 hours (00:00–23:59)                  |
| ABSOLUTE - TODAY | Today's progress with hour grid (rainbow colors)  | Full 24 hours today                          |
| ACTIVE    | Progress during active/waking hours                      | 07:00–22:00 (customizable in `config.js`)   |
| ACTIVE - TODAY | Today's active hours with hour grid                 | 07:00–22:00 today (customizable)            |
| WORK      | Progress during work hours (weekdays only)               | 08:00–20:00 (customizable in `config.js`)   |
| WORK - TODAY | Today's work hours with hour grid (weekends = 100%) | 08:00–20:00 today (customizable)            |
| LIFE      | Progress through your life from birth; day grid + phases | From DOB to expected lifespan               |
| LIFE - CURRENT PHASE | Progress and day grid for the current life phase only | Start to end of active phase (by age) |

Time-window settings for Active and Work are in `config.js`. Life settings (DOB, lifespan, phase boundaries) are set in the in-app modal and stored in `localStorage`.

## Usage

1. Open [https://andrew-voronin.github.io/voroninpy.github.io/](https://andrew-voronin.github.io/voroninpy.github.io/)
2. For best experience, use on an iPad in portrait mode
3. Click anywhere to cycle: Absolute → Absolute - Today → Active → Active - Today → Work → Work - Today → Life → Life - Current Phase
4. In Life or Life - Current Phase mode, open settings via the gear icon in the top-right corner (visible on hover on desktop), or long-press anywhere on the screen (touch fallback). Configure DOB, expected lifespan (50–200 years), and life phase age boundaries
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