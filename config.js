// --- Time Window Configuration ------------------
const ACTIVE_START = "07:00";   // HH:MM 24-h 
const ACTIVE_END   = "22:00";

const WORK_START   = "08:00";
const WORK_END     = "20:00";

// --- Development Mode Configuration ------------------
const DEV_MODE_ENABLED = false;  // Set to false for production

// --- Animation Configuration ------------------
const FADE_IN_DURATION   = 250;  // ms
const VISIBLE_DURATION   = 1750; // ms
const FADE_OUT_DURATION  = 250;  // ms

// --- Helper Functions ------------------
function toSeconds(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 3600 + m * 60;
}

// --- Mode Configuration ------------------
const MODES = {
  ABSOLUTE: { 
    name: "ABSOLUTE",
    calculateProgress: function(now, unit, startDate, endDate) {
      return (now - startDate) / (endDate - startDate);
    }
  },
  ACTIVE: {
    name: "ACTIVE",
    start: ACTIVE_START,
    end: ACTIVE_END,
    calculateProgress: function(now, unit, startDate, endDate) {
      // This will call the function defined in script.js
      return calculateWindowProgress(now, unit, startDate, endDate, this.start, this.end);
    }
  },
  WORK: {
    name: "WORK",
    start: WORK_START,
    end: WORK_END,
    calculateProgress: function(now, unit, startDate, endDate) {
      // This will call the function defined in script.js
      return calculateWindowProgress(now, unit, startDate, endDate, this.start, this.end);
    }
  },
  LIFE: {
    name: "LIFE",
    calculateProgress: function(now, unit, startDate, endDate) {
      return (now - startDate) / (endDate - startDate);
    }
  }
};

// --- Mode Array for Cycling ------------------
const MODE_CYCLE = [MODES.ABSOLUTE, MODES.ACTIVE, MODES.WORK, MODES.LIFE]; 