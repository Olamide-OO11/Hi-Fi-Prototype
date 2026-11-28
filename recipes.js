/* 
   recipes.js - shared by every page
   Holds the data and the small helper functions that
   more than one page needs. Load it BEFORE a page's own
   script, because that script uses what is defined here.

   //CODE LINE 36 - AWARE
    */

// The name we save recipes under in the browser's localStorage
const STORAGE_KEY = 'prepmate-recipes-v2';


/* ---------- Sample data (placeholders, swap for your own) ---------- */

// Recipes shown on the Discover page. Each is an object:
// { property: value, ... }, and the array [ ... ] is a list of them.
const discoverRecipes = [
    { id: 'ramen',     title: 'Ramen',           minutes: 40, image: 'images/ramen.jpg' },
    { id: 'meatballs', title: 'Meatballs',       minutes: 30, image: 'images/meatballs.jpg' },
    { id: 'salmon',    title: 'Salmon & Greens', minutes: 25, image: 'images/salmon.jpg' }
];

// Recipes already in the Recipe Book the first time the app opens.
// timer: hours, minutes, seconds (all zero means "no timer").

const starterRecipes = [
    {
        id: 'ramen', title: 'Ramen', image: 'images/ramen.jpg', mode: 'steps',
        description: 'Noodles in a rich broth.', servings: '2',
        favourite: false, lastOpened: null,
        steps: [
            { name: 'Make broth',    instruction: 'Simmer the stock with the seasoning.', timer: { hours: 0, minutes: 25, seconds: 0 }, notes: '' },
            { name: 'Cook noodles',  instruction: 'Cook the noodles in a separate pan.',  timer: { hours: 0, minutes: 3,  seconds: 0 }, notes: '' }
        ]
    },
    {
        // Steps 1 to 3 are inspired from the mid-fi. Steps 4 to 6 are sample placeholders: so make sure to REPLACE 
        id: 'spaghetti-bolognese', title: 'Spaghetti Bolognese', image: 'images/spaghetti.jpg', mode: 'steps',
        description: 'Classic family pasta.', servings: '4',
        favourite: true, lastOpened: null,
        steps: [
            { name: 'Chop Vegetables', instruction: 'Chop garlic, onions, carrots and celery finely.', timer: { hours: 0, minutes: 0, seconds: 0 }, notes: '' },
            { name: 'Fry Vegetables',  instruction: 'Add a tbsp of oil to the pan and add the vegetables. Fry on medium heat for 7 minutes.', timer: { hours: 0, minutes: 7, seconds: 0 }, notes: '' },
            { name: 'Cook Pasta',      instruction: 'Fill a pot with 2 litres of water, and bring to boil. Once boiling, add your pasta, and cook for 10 minutes.', timer: { hours: 0, minutes: 10, seconds: 0 }, notes: 'Let water boil fully before adding pasta' },
            { name: 'Add the mince',   instruction: 'Add the mince to the vegetables and brown it, then stir in the sauce.', timer: { hours: 0, minutes: 0, seconds: 0 }, notes: '' },
            { name: 'Simmer sauce',    instruction: 'Turn the heat down and let the sauce simmer.', timer: { hours: 0, minutes: 20, seconds: 0 }, notes: '' },
            { name: 'Combine and serve', instruction: 'Drain the pasta, mix with the sauce and serve.', timer: { hours: 0, minutes: 0, seconds: 0 }, notes: '' }
        ]
    },
    {
        id: 'burger', title: 'Burger', image: 'images/burger.jpg', mode: 'steps',
        description: 'Home-made burgers.', servings: '2',
        favourite: true, lastOpened: null,
        steps: [
            { name: 'Shape patties', instruction: 'Shape the mince into patties.', timer: { hours: 0, minutes: 0, seconds: 0 }, notes: '' },
            { name: 'Fry patties',   instruction: 'Fry each side until cooked through.', timer: { hours: 0, minutes: 8, seconds: 0 }, notes: '' }
        ]
    },
    {
        // The multi-timer example from the mid-fi (Cook Rice 20 min, Prep Chicken 10 min from minute 5, Fry Chicken 12 min from minute 15)
        id: 'chicken-and-rice', title: 'Chicken and Rice', image: 'images/chicken-rice.jpg', mode: 'timers',
        description: 'Rice and pan-fried chicken, timed to run together.', servings: '2',
        favourite: false, lastOpened: null,
        steps: [
            { name: 'Cook Rice',    instruction: 'Cook the rice.',          timer: { hours: 0, minutes: 20, seconds: 0 }, startOffset: 0,  notes: '' },
            { name: 'Prep Chicken', instruction: 'Prepare the chicken.',    timer: { hours: 0, minutes: 10, seconds: 0 }, startOffset: 5,  notes: '' },
            { name: 'Fry Chicken',  instruction: 'Fry the chicken.',        timer: { hours: 0, minutes: 12, seconds: 0 }, startOffset: 15, notes: '' }
        ]
    }
];

/* ------ Saving and loading ---- */

// localStorage can only store text, so we convert the array to text (JSON.stringify)
// when saving and back to an array (JSON.parse) when loading.
function saveRecipes(list) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

function loadRecipes() {
    const saved = localStorage.getItem(STORAGE_KEY);

    // First visit: nothing saved yet, so start with the sample recipes
    if (saved === null) {
        saveRecipes(starterRecipes);
        return starterRecipes;
    }

    // try/catch stops the whole page breaking if the saved text is corrupted
    try {
        return JSON.parse(saved);
    } catch (error) {
        console.error('Could not read saved recipes:', error);
        return [];
    }
}


/* ---------- Small helpers ---------- */

// Creates an element, optionally with a class and some text.
// We use textContent (not innerHTML) for text so anything a user types
// is shown as plain text and can never run as code.
function makeEl(tag, className, text) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
}

// Creates a Font Awesome icon, e.g. makeIcon('fa-solid fa-play')
function makeIcon(classes) {
    const icon = makeEl('i', classes);
    icon.setAttribute('aria-hidden', 'true');   // decorative, so screen readers skip it
    return icon;
}

// Turns { hours: 0, minutes: 10, seconds: 0 } into "10 min"
function formatTimer(timer) {
    if (!timer) return '';
    const parts = [];
    if (timer.hours)   parts.push(timer.hours + ' hr');
    if (timer.minutes) parts.push(timer.minutes + ' min');
    if (timer.seconds) parts.push(timer.seconds + ' sec');
    return parts.join(' ');
}


/* ---------- Settings (Alert Preferences + Voice Commands) ---------- */

// Used by the Settings page and the Cooking page. Saved in localStorage like recipes.
// Default alert is 'medium' (not 'quiet') because most think-aloud testers wanted an
// audio cue when a timer finishes. Voice starts OFF because it needs microphone permission.
const SETTINGS_KEY = 'prepmate-settings';
const DEFAULT_SETTINGS = { alert: 'medium', voice: false };

function loadSettings() {
    try {
        const saved = JSON.parse(localStorage.getItem(SETTINGS_KEY));   // null if nothing saved
        // Object.assign copies the defaults first, then anything saved overrides them
        return Object.assign({}, DEFAULT_SETTINGS, saved);
    } catch (error) {
        return Object.assign({}, DEFAULT_SETTINGS);
    }
}

function saveSettings(settings) {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}


/* ---------- Sound (no audio file needed) ---------- */

// The browser's Web Audio API can make a beep from code. Browsers only allow sound
// after the user has tapped something, so prepareAudio() is called from button clicks.
let audioContext = null;

function prepareAudio() {
    try {
        if (!audioContext) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (audioContext.state === 'suspended') {
            audioContext.resume();
        }
    } catch (error) {
        console.error('Audio not available:', error);
    }
}

// Plays "times" short beeps, 0.35 seconds apart
function playBeep(times) {
    prepareAudio();
    if (!audioContext) return;

    for (let i = 0; i < times; i++) {
        const oscillator = audioContext.createOscillator();   // makes the tone
        const volume = audioContext.createGain();             // controls how loud
        oscillator.frequency.value = 880;                     // pitch in Hz
        volume.gain.value = 0.2;
        oscillator.connect(volume);
        volume.connect(audioContext.destination);             // out to the speakers

        const startAt = audioContext.currentTime + i * 0.35;
        oscillator.start(startAt);
        oscillator.stop(startAt + 0.2);
    }
}
