/* =====================================================
   settings.js | Settings page
   Pattern: load saved settings -> show them in the form -> save on every change.
   The Cooking page reads the same settings with loadSettings().
   ===================================================== */

const settings = loadSettings();

const alertRadios  = document.querySelectorAll('input[name="alert"]');
const voiceToggle  = document.getElementById('voice-toggle');
const alertHelp    = document.getElementById('alert-help');
const voiceHelp    = document.getElementById('voice-help');
const testBtn      = document.getElementById('test-alert');
const message      = document.getElementById('settings-message');

// What each alert level does (shown under the options)
const ALERT_TEXT = {
    quiet:  'Quiet: a banner on screen only, no sound.',
    medium: 'Medium: a banner and two beeps.',
    loud:   'Loud: a banner, repeating beeps and vibration until you dismiss it.'
};

// Is speech recognition available in this browser? (Chrome and Edge only)
const voiceSupported = Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);


/* ---------- Show the saved choices ---------- */

alertRadios.forEach(function (radio) {
    radio.checked = (radio.value === settings.alert);       // tick the saved one
});
voiceToggle.checked = settings.voice;
alertHelp.textContent = ALERT_TEXT[settings.alert];

voiceHelp.textContent = voiceSupported
    ? 'The browser will ask for microphone permission the first time you cook. Try saying Next, Back, Play, Pause or Dismiss.'
    : 'Voice commands are not supported in this browser. Try Chrome or Edge.';
voiceToggle.disabled = !voiceSupported;


/* ---------- Save when something changes ---------- */

function saved() {
    saveSettings(settings);
    message.textContent = 'Saved';
    message.className = 'message success';
}

// LISTEN on each radio button
alertRadios.forEach(function (radio) {
    radio.addEventListener('change', function () {
        settings.alert = radio.value;
        alertHelp.textContent = ALERT_TEXT[settings.alert];
        saved();
    });
});

voiceToggle.addEventListener('change', function () {
    settings.voice = voiceToggle.checked;
    saved();
});

// "Test alert" plays whatever the current level would do, so you can hear it
testBtn.addEventListener('click', function () {
    if (settings.alert === 'medium') playBeep(2);
    if (settings.alert === 'loud') {
        playBeep(3);
        if (navigator.vibrate) navigator.vibrate([300, 150, 300]);
    }
    message.textContent = settings.alert === 'quiet'
        ? 'Quiet is on: alerts are a banner only, so there is nothing to play.'
        : 'Test alert played.';
    message.className = 'message success';
});
