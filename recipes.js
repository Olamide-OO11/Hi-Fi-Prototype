/* =====================================================
   recipes.js | shared by every page
   Holds the data and the small helper functions that
   more than one page needs. Load it BEFORE a page's own
   script, because that script uses what is defined here.
   ===================================================== */

// The name we save recipes under in the browser's localStorage
const STORAGE_KEY = 'prepmate-recipes';


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
        id: 'ramen', title: 'Ramen', image: 'images/ramen.jpg',
        description: 'Noodles in a rich broth.', servings: '2',
        favourite: false, lastOpened: null,
        steps: [
            { name: 'Make broth',    instruction: 'Simmer the stock with the seasoning.', timer: { hours: 0, minutes: 25, seconds: 0 }, notes: '' },
            { name: 'Cook noodles',  instruction: 'Cook the noodles in a separate pan.',  timer: { hours: 0, minutes: 3,  seconds: 0 }, notes: '' }
        ]
    },
    {
        id: 'spaghetti-bolognese', title: 'Spaghetti Bolognese', image: 'images/spaghetti.jpg',
        description: 'Classic family pasta.', servings: '4',
        favourite: true, lastOpened: null,
        steps: [
            { name: 'Boil water', instruction: 'Fill a pot with 2 litres of water, add a pinch of salt, and set to high heat.', timer: { hours: 0, minutes: 10, seconds: 0 }, notes: 'Let water boil fully before adding pasta' },
            { name: 'Simmer sauce', instruction: 'Brown the mince, add the sauce and simmer.', timer: { hours: 0, minutes: 20, seconds: 0 }, notes: '' }
        ]
    },
    {
        id: 'burger', title: 'Burger', image: 'images/burger.jpg',
        description: 'Home-made burgers.', servings: '2',
        favourite: true, lastOpened: null,
        steps: [
            { name: 'Shape patties', instruction: 'Shape the mince into patties.', timer: { hours: 0, minutes: 0, seconds: 0 }, notes: '' },
            { name: 'Fry patties',   instruction: 'Fry each side until cooked through.', timer: { hours: 0, minutes: 8, seconds: 0 }, notes: '' }
        ]
    }
];


/* ---------- Saving and loading ---------- */

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
