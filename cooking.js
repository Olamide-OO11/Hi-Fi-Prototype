/* 
   cooking.js | placeholder cooking page
   Shows how a page receives data from a link:
   recipe-book.js sends cooking.html?id=burger and we read the "id" back.
 */


/*
const params   = new URLSearchParams(window.location.search);   // everything after the ?
const recipeId = params.get('id');                               // e.g. 'burger'

// find() returns the first recipe whose id matches, or undefined if none does
const recipe = loadRecipes().find(function (item) {
    return item.id === recipeId;
});

if (!recipe) {
    document.getElementById('cooking-info').textContent = 'Recipe not found. Go back to the Recipe Book.';
} else {
    document.getElementById('cooking-title').textContent = recipe.title;
    document.getElementById('cooking-info').textContent = recipe.steps.length + ' steps. The cooking screen is coming next.';

    recipe.steps.forEach(function (step) {
        let text = step.name || 'Untitled step';
        if (formatTimer(step.timer)) text += ' (' + formatTimer(step.timer) + ')';
        document.getElementById('cooking-steps').appendChild(makeEl('li', '', text));
    });
}
*/







/* =====================================================
   cooking.js | the Cooking screen
   One page, two "modes" decided by the recipe:
     'steps'  -> one step at a time with a progress bar (Spaghetti in the mid-fi)
     'timers' -> every timer on one screen (Chicken and Rice in the mid-fi)
   Plus: timer-done alerts, optional voice commands, Meal Complete screen.

   THE BIG IDEAS (read these first):
   1. STATE: a few variables hold everything that can change (timers, currentStep ...).
   2. render() draws the screen from that state. Change state, call render().
   3. A "tick" runs 4 times a second to check timers and update the clock text.
   4. Timers store an END TIME (a clock timestamp), not a number that counts down.
   ===================================================== */


/* ---------- 1. Load the recipe and settings ---------- */

const params   = new URLSearchParams(window.location.search);   // everything after the ?
const recipeId = params.get('id');                               // e.g. 'chicken-and-rice'

// find() returns the first recipe whose id matches, or undefined if none does
const recipe   = loadRecipes().find(function (item) { return item.id === recipeId; });
const settings = loadSettings();                                 // alert level + voice on/off

// SELECT the parts of the page we will change
const cookBody       = document.getElementById('cook-body');
const cookTitle      = document.getElementById('cook-title');
const alertBanner    = document.getElementById('alert-banner');
const completeScreen = document.getElementById('complete-screen');

// If the recipe has no mode (older data), treat it as step-by-step
const mode = recipe ? (recipe.mode || 'steps') : 'steps';


/* ---------- 2. State (everything that can change) ---------- */

let timers      = [];     // one object per timed step (see buildTimers)
let currentStep = 0;      // steps mode: which step we are on (0 = first)
let masterStart = null;   // timers mode: when the meal clock started (null = not yet)
let tickId      = null;   // id of the repeating tick, so we can stop it later
let alertQueue  = [];     // timers that finished and are waiting to be shown
let activeAlert = null;   // the finished timer currently showing in the banner
let alarmId     = null;   // id of the repeating alarm sound (loud setting)
let allDoneSince = null;  // when every timer first became done (see checkAllDone)
let voiceOn     = false;  // true while voice commands are actually listening
let recognition = null;   // the browser's speech recogniser
let finished    = false;
let focusKey    = null;   // which button had keyboard focus (so we can give it back)


/* ---------- 3. Small helpers ---------- */

// 5 -> "05", so clocks look like 07:05
function pad(n) {
    return String(n).padStart(2, '0');
}

// Seconds -> "7:00" (withHours false) or "00:07:00" (withHours true)
function formatClock(totalSeconds, withHours) {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    if (withHours) return pad(h) + ':' + pad(m) + ':' + pad(s);
    return Math.floor(totalSeconds / 60) + ':' + pad(s);
}

// Minutes -> "00:15" (hours:minutes), used for Start Time / Finish Time
function formatOffset(minutes) {
    return pad(Math.floor(minutes / 60)) + ':' + pad(minutes % 60);
}

// { hours, minutes, seconds } -> total seconds
function secondsOf(timer) {
    if (!timer) return 0;
    return (timer.hours || 0) * 3600 + (timer.minutes || 0) * 60 + (timer.seconds || 0);
}


/* ---------- 4. The timer engine ---------- */

// A timer object looks like:
// { id, stepIndex, name, total, remaining, endTime, status, startOffset }
//   status is 'idle' (not started), 'running', 'paused' or 'done'.
//   remaining is used while idle/paused; endTime is used while running.
function buildTimers() {
    recipe.steps.forEach(function (step, index) {
        const total = secondsOf(step.timer);
        if (total > 0) {                                  // steps with no timer get none
            timers.push({
                id: 't' + index,
                stepIndex: index,
                name: step.name || 'Untitled step',
                total: total,
                remaining: total,
                endTime: null,
                status: 'idle',
                startOffset: Number(step.startOffset) || 0    // minutes into the meal
            });
        }
    });
}

// How many seconds are left on a timer, right now.
// WHY END TIMES: if we just did "remaining = remaining - 1" every second, a browser tab
// in the background runs slowly and the timer would drift. Comparing the clock to a fixed
// end time is always correct, however often (or rarely) this function is called.
function getRemaining(t) {
    if (t.status === 'running') {
        return Math.max(0, Math.ceil((t.endTime - Date.now()) / 1000));
    }
    if (t.status === 'done') return 0;
    return t.remaining;                                   // idle or paused
}

function startTimer(t) {
    const seconds = (t.status === 'done') ? t.total : t.remaining;   // restart a finished timer from the top
    t.remaining = seconds;
    t.endTime   = Date.now() + seconds * 1000;            // the moment it will finish
    t.status    = 'running';
    if (mode === 'timers' && masterStart === null) {
        masterStart = Date.now();                         // the first Play starts the meal clock
    }
}

function pauseTimer(t) {
    t.remaining = getRemaining(t);                        // remember how much was left
    t.endTime   = null;
    t.status    = 'paused';
}

function resetTimer(t) {
    t.remaining = t.total;
    t.endTime   = null;
    t.status    = 'idle';
}

// deltaSeconds is +60 or -60 for the "+ 1 min -" buttons
function adjustTimer(t, deltaSeconds) {
    if (t.status === 'done') return;
    if (t.status === 'running') {
        t.endTime += deltaSeconds * 1000;                 // move the finish line
    } else {
        t.remaining = Math.max(0, t.remaining + deltaSeconds);
    }
}


/* ---------- 5. Building the screen ---------- */

// A button that carries data-action and data-id, so ONE click listener (section 6)
// can handle every button. Content is an icon or some text.
function actionButton(className, action, id, label, content) {
    const button = makeEl('button', className);
    button.type = 'button';
    button.dataset.action = action;        // read later as button.dataset.action
    if (id) button.dataset.id = id;
    button.setAttribute('aria-label', label);
    button.appendChild(content);
    return button;
}

// One timer card. Used by both modes, with small differences.
function buildTimerCard(t) {
    const isDone = (t.status === 'done');

    // Green card when finished (the class is styled in style.css)
    const card = makeEl('article', isDone ? 'timer-card timer-card--done' : 'timer-card');

    const row  = makeEl('div', 'timer-row-main');
    const info = makeEl('div', 'timer-info');

    const label = (isDone && mode === 'steps') ? t.name + ' - Complete' : t.name;
    info.appendChild(makeEl('span', 'timer-name', label));

    // data-time marks this text so updateDisplays() can refresh just the numbers each tick
    const time = makeEl('span', 'timer-time', formatClock(getRemaining(t), mode === 'timers'));
    time.dataset.time = t.id;
    info.appendChild(time);
    row.appendChild(info);

    const controls = makeEl('div', 'timer-controls');

    if (mode === 'steps') {
        // "+ 1 min -" adjuster from the mid-fi
        const adjust = makeEl('div', 'adjust');
        adjust.appendChild(actionButton('icon-btn', 'plus', t.id, 'Add one minute', makeEl('span', '', '+')));
        adjust.appendChild(makeEl('span', '', '1 min'));
        adjust.appendChild(actionButton('icon-btn', 'minus', t.id, 'Take one minute off', makeEl('span', '', '-')));
        controls.appendChild(adjust);
    } else {
        // Edit button is in the mid-fi but not built yet, so it is disabled for now
        const edit = actionButton('icon-btn', 'edit', t.id, 'Edit timer (coming soon)', makeIcon('fa-regular fa-pen-to-square'));
        edit.disabled = true;
        controls.appendChild(edit);
    }

    controls.appendChild(actionButton('icon-btn', 'reset', t.id, 'Reset timer', makeIcon('fa-solid fa-rotate-right')));

    // One button that swaps between play and pause depending on status
    const running = (t.status === 'running');
    controls.appendChild(actionButton('icon-btn', 'toggle', t.id,
        running ? 'Pause timer' : 'Start timer',
        makeIcon(running ? 'fa-solid fa-pause' : 'fa-solid fa-play')));

    row.appendChild(controls);
    card.appendChild(row);

    // Timers mode also shows when the task starts and finishes
    if (mode === 'timers') {
        const meta = makeEl('div', 'timer-meta');
        meta.appendChild(makeEl('span', '', 'Start Time: ' + formatOffset(t.startOffset)));
        meta.appendChild(makeEl('span', '', 'Finish Time: ' + formatOffset(t.startOffset + Math.ceil(t.total / 60))));
        card.appendChild(meta);
    }

    return card;
}

// A line like "say 'Next' to go to the next step". Only shown when voice is actually on.
function voiceHint(text) {
    return voiceOn ? makeEl('p', 'voice-hint', text) : null;
}

// ----- Step-by-step view -----
function renderSteps() {
    const step = recipe.steps[currentStep];
    const total = recipe.steps.length;

    // Progress segments: one per step, dark up to the current one
    const progress = makeEl('div', 'progress');
    progress.setAttribute('role', 'progressbar');
    progress.setAttribute('aria-label', 'Recipe progress');
    progress.setAttribute('aria-valuemin', '1');
    progress.setAttribute('aria-valuemax', String(total));
    progress.setAttribute('aria-valuenow', String(currentStep + 1));
    for (let i = 0; i < total; i++) {
        progress.appendChild(makeEl('span', i <= currentStep ? 'progress-seg is-done' : 'progress-seg'));
    }
    cookBody.appendChild(progress);

    // The step itself
    const text = makeEl('section', 'step-text');
    text.appendChild(makeEl('h2', '', step.name || 'Untitled step'));
    text.appendChild(makeEl('p', '', step.instruction));
    if (step.notes) text.appendChild(makeEl('p', 'step-notes', step.notes));
    cookBody.appendChild(text);

    // Previous / "Step 2 of 9" / Next
    const isLast = (currentStep === total - 1);
    const nav = makeEl('div', 'step-nav');
    const prev = actionButton('round-btn', 'prev', null, 'Previous step', makeIcon('fa-solid fa-chevron-left'));
    prev.disabled = (currentStep === 0);
    nav.appendChild(prev);
    nav.appendChild(makeEl('span', '', 'Step ' + (currentStep + 1) + ' of ' + total));
    nav.appendChild(actionButton('round-btn', 'next', null,
        isLast ? 'Finish meal' : 'Next step',
        makeIcon(isLast ? 'fa-solid fa-check' : 'fa-solid fa-chevron-right')));
    cookBody.appendChild(nav);

    const nextHint = voiceHint(isLast ? "say 'Next' to finish the meal" : "say 'Next' to go to the next step");
    if (nextHint) cookBody.appendChild(nextHint);

    // Timers section: this step's timer first, then any earlier timers that were started
    const section = makeEl('section', 'timers-section');
    section.appendChild(makeEl('h2', '', 'Timers'));
    const playHint = voiceHint("say 'Play' to play the current step's timer");
    if (playHint) section.appendChild(playHint);

    const visible = timers.filter(function (t) {
        return t.stepIndex === currentStep || t.status !== 'idle';
    });
    // sort() with (b - a): true counts as 1, false as 0, so this puts the current step's timer first
    visible.sort(function (a, b) {
        return (b.stepIndex === currentStep) - (a.stepIndex === currentStep);
    });

    if (visible.length === 0) {
        section.appendChild(makeEl('p', 'cook-note', 'No timers active.'));
    }
    visible.forEach(function (t) { section.appendChild(buildTimerCard(t)); });
    cookBody.appendChild(section);
}

// ----- Multi-timer view -----
function renderTimersMode() {
    const active    = timers.filter(function (t) { return t.status !== 'done'; })
                            .sort(function (a, b) { return a.startOffset - b.startOffset; });
    const completed = timers.filter(function (t) { return t.status === 'done'; });

    // "Active Tasks" heading with the meal clock on the right
    const head = makeEl('div', 'active-head');
    head.appendChild(makeEl('h2', '', 'Active Tasks'));
    const clock = makeEl('span', 'master-clock', '00:00:00');
    clock.dataset.master = 'true';
    head.appendChild(clock);
    cookBody.appendChild(head);

    const activeList = makeEl('div', 'tasks');
    if (timers.length === 0) {
        activeList.appendChild(makeEl('p', 'cook-note', 'This recipe has no timers. Add a timer to a step to use this view.'));
    } else if (active.length === 0) {
        activeList.appendChild(makeEl('p', 'cook-note', 'All Tasks Complete!'));
    }
    active.forEach(function (t) { activeList.appendChild(buildTimerCard(t)); });
    cookBody.appendChild(activeList);

    const doneList = makeEl('div', 'tasks');
    doneList.appendChild(makeEl('h2', 'tasks-heading', 'Completed Tasks'));
    if (completed.length === 0) {
        doneList.appendChild(makeEl('p', 'cook-note', 'No tasks complete.'));
    }
    completed.forEach(function (t) { doneList.appendChild(buildTimerCard(t)); });
    cookBody.appendChild(doneList);

    updateDisplays();
}

// Wipes and redraws the whole screen from the state above
function render() {
    cookBody.innerHTML = '';

    if (recipe.steps.length === 0) {
        cookBody.appendChild(makeEl('p', 'cook-note', 'This recipe has no steps yet.'));
        return;
    }

    if (mode === 'timers') renderTimersMode();
    else renderSteps();

    restoreFocus();
}

// render() destroys and rebuilds every button, which would drop keyboard focus.
// So we remember which button was used and focus the new copy of it.
function restoreFocus() {
    if (!focusKey) return;
    const parts = focusKey.split('|');
    let selector = 'button[data-action="' + parts[0] + '"]';
    if (parts[1]) selector += '[data-id="' + parts[1] + '"]';
    const button = cookBody.querySelector(selector);
    if (button && !button.disabled) button.focus();
}

// Called every tick. Only changes the NUMBERS, never rebuilds buttons.
// WHY: if we rebuilt the buttons 4 times a second, a tap could land on a button that
// was just replaced and get lost. Updating the text is safe.
function updateDisplays() {
    cookBody.querySelectorAll('[data-time]').forEach(function (span) {
        const t = timers.find(function (item) { return item.id === span.dataset.time; });
        if (t) span.textContent = formatClock(getRemaining(t), mode === 'timers');
    });

    const clock = cookBody.querySelector('[data-master]');
    if (clock) {
        const elapsed = masterStart === null ? 0 : Math.floor((Date.now() - masterStart) / 1000);
        clock.textContent = formatClock(elapsed, true);
    }
}


/* ---------- 6. Buttons (event delegation) ---------- */

// ONE listener on the whole body instead of one per button.
// closest() walks up from whatever was tapped to the nearest button with data-action,
// so it still works if the tap landed on the icon inside the button.
cookBody.addEventListener('click', function (event) {
    const button = event.target.closest('button[data-action]');
    if (!button || button.disabled) return;

    prepareAudio();                         // a tap is our chance to unlock sound (see recipes.js)
    focusKey = button.dataset.action + '|' + (button.dataset.id || '');

    const action = button.dataset.action;
    const t = timers.find(function (item) { return item.id === button.dataset.id; });

    if (action === 'next')   goNext();
    else if (action === 'prev') goBack();
    else if (t) {
        if (action === 'toggle') { if (t.status === 'running') pauseTimer(t); else startTimer(t); }
        else if (action === 'reset') resetTimer(t);
        else if (action === 'plus')  adjustTimer(t, 60);
        else if (action === 'minus') adjustTimer(t, -60);
    }
    render();
});

function goNext() {
    if (currentStep < recipe.steps.length - 1) currentStep++;
    else finishMeal();                      // "next" on the last step ends the meal
}

function goBack() {
    if (currentStep > 0) currentStep--;
}


/* ---------- 7. The tick: checks timers 4 times a second ---------- */

function tick() {
    let changed = false;

    // Multi-timer mode: start each task automatically when the meal clock reaches its start time
    if (mode === 'timers' && masterStart !== null) {
        const elapsedSeconds = (Date.now() - masterStart) / 1000;
        timers.forEach(function (t) {
            if (t.status === 'idle' && elapsedSeconds >= t.startOffset * 60) {
                startTimer(t);
                changed = true;
            }
        });
    }

    // Has any running timer reached zero?
    timers.forEach(function (t) {
        if (t.status === 'running' && getRemaining(t) <= 0) {
            t.status = 'done';
            t.remaining = 0;
            t.endTime = null;
            raiseAlert(t);
            changed = true;
        }
    });

    if (changed) render();                  // something changed shape: redraw
    else updateDisplays();                  // otherwise just refresh the numbers

    checkAllDone();
}

// Multi-timer mode: when every timer is done and the last alert is dismissed,
// wait 2.5 seconds (so "All Tasks Complete!" can be seen), then show Meal Complete.
function checkAllDone() {
    if (finished || mode !== 'timers' || timers.length === 0) return;

    const everyDone = timers.every(function (t) { return t.status === 'done'; });
    const quiet = (activeAlert === null && alertQueue.length === 0);

    if (everyDone && quiet) {
        if (allDoneSince === null) allDoneSince = Date.now();
        else if (Date.now() - allDoneSince > 2500) finishMeal();
    } else {
        allDoneSince = null;
    }
}


/* ---------- 8. Alerts ---------- */

// A timer finished: add it to the queue. If nothing is showing, show it now.
function raiseAlert(t) {
    alertQueue.push(t);
    if (activeAlert === null) showNextAlert();
}

function showNextAlert() {
    stopAlarm();

    if (alertQueue.length === 0) {
        activeAlert = null;
        alertBanner.hidden = true;
        return;
    }

    activeAlert = alertQueue.shift();       // take the first one off the queue

    alertBanner.innerHTML = '';
    alertBanner.appendChild(makeEl('span', '', activeAlert.name + ' - Timer Done'));
    alertBanner.appendChild(makeEl('small', '', voiceOn ? "say 'Dismiss' to dismiss timer" : 'Tap to dismiss'));
    alertBanner.hidden = false;

    startAlarm();
}

function dismissAlert() {
    if (activeAlert === null) return;
    showNextAlert();                        // shows the next waiting alert, or hides the banner
}

alertBanner.addEventListener('click', function () {
    prepareAudio();
    dismissAlert();
});

// The alert setting from the Settings page decides how noticeable it is
function startAlarm() {
    if (settings.alert === 'quiet') return;                 // banner only, no sound

    if (settings.alert === 'medium') {
        playBeep(2);                                        // two beeps, once
        return;
    }

    // loud: beeps and vibration repeat until the alert is dismissed
    function loudBurst() {
        playBeep(3);
        if (navigator.vibrate) navigator.vibrate([300, 150, 300]);
    }
    loudBurst();
    alarmId = setInterval(loudBurst, 2500);
}

function stopAlarm() {
    if (alarmId !== null) {
        clearInterval(alarmId);
        alarmId = null;
    }
    if (navigator.vibrate) navigator.vibrate(0);            // stop any vibration
}


/* ---------- 9. Voice commands (optional) ---------- */

// Uses the browser's built-in SpeechRecognition. It only works in Chrome/Edge and needs
// the microphone, so we ask first and quietly do nothing if it is not available.
function setupVoice() {
    const Recogniser = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!settings.voice || !Recogniser) return;

    recognition = new Recogniser();
    recognition.continuous = true;          // keep listening, not just one phrase
    recognition.lang = 'en-GB';

    // Fires each time the browser has understood something
    recognition.onresult = function (event) {
        const latest = event.results[event.results.length - 1];
        handleVoice(latest[0].transcript.toLowerCase());
    };

    // Browsers stop listening every so often, so start again while voice is meant to be on
    recognition.onend = function () {
        if (voiceOn && !finished) {
            try { recognition.start(); } catch (error) { /* already starting */ }
        }
    };

    // If the user says no to the microphone, switch voice off and remove the hints
    recognition.onerror = function (event) {
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
            voiceOn = false;
            render();
        }
    };

    try {
        recognition.start();
        voiceOn = true;
    } catch (error) {
        voiceOn = false;
    }
}

// Turns a spoken phrase into the same actions the buttons do
function handleVoice(phrase) {
    if (finished) return;

    // includes() checks whether the word appears anywhere in what was heard
    if (phrase.includes('dismiss')) {
        dismissAlert();
    } else if (mode === 'steps') {
        const current = timers.find(function (t) { return t.stepIndex === currentStep; });

        if (phrase.includes('next')) goNext();
        else if (phrase.includes('back') || phrase.includes('previous')) goBack();
        else if (phrase.includes('play') || phrase.includes('start')) { if (current && current.status !== 'running') startTimer(current); }
        else if (phrase.includes('pause') || phrase.includes('stop'))  { if (current && current.status === 'running') pauseTimer(current); }
    }
    render();
}


/* ---------- 10. Finishing ---------- */

function finishMeal() {
    finished = true;
    clearInterval(tickId);                  // stop the tick
    stopAlarm();
    alertBanner.hidden = true;
    if (recognition) { try { recognition.stop(); } catch (error) { /* ignore */ } }

    completeScreen.hidden = false;          // show the green Meal Complete screen
    document.getElementById('return-link').focus();
}

// Replay simply reloads the page, which resets all the state variables
document.getElementById('replay-btn').addEventListener('click', function () {
    window.location.reload();
});


/* ---------- 11. Keep the screen awake while cooking ---------- */

// Phones dim and lock after a while. The Wake Lock API asks the browser not to,
// which matters when your hands are busy. It fails quietly if unsupported.
function keepScreenAwake() {
    if ('wakeLock' in navigator) {
        navigator.wakeLock.request('screen').catch(function () { /* not allowed, carry on */ });
    }
}


/* ---------- 12. Start ---------- */

if (!recipe) {
    cookBody.appendChild(makeEl('p', 'cook-note', 'Recipe not found. Go back to the Recipe Book.'));
} else {
    cookTitle.textContent = recipe.title;
    buildTimers();
    setupVoice();
    keepScreenAwake();
    render();
    tickId = setInterval(tick, 250);        // run tick() every 250 milliseconds
}
