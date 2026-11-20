/* 
   add-recipe.js -  Add Recipe page
   Three jobs: 1) switch tabs  2) add step cards 3) save the recipe
    */

// ---------- SELECT everything we need once, at the top ----------
const tabButtons   = document.querySelectorAll('.tab');
const panelDetails = document.getElementById('panel-details');
const panelSteps   = document.getElementById('panel-steps');
const stepsList    = document.getElementById('steps-list');
const addStepBtn   = document.getElementById('add-step-btn');
const saveBtn      = document.getElementById('save-recipe');
const saveMessage  = document.getElementById('save-message');


/* ---------- 1. Tabs ---------- */

// Show one panel, hide the other, and mark the matching tab as pressed
function showTab(name) {
    panelDetails.hidden = (name !== 'details');   // true hides it, false shows it
    panelSteps.hidden   = (name !== 'steps');

    tabButtons.forEach(function (button) {
        button.setAttribute('aria-pressed', button.dataset.tab === name);
    });
}

// LISTEN: each tab button calls showTab with the name from its data-tab attribute 
tabButtons.forEach(function (button) {
    button.addEventListener('click', function () {
        showTab(button.dataset.tab);
    });
});


/* ---------- 2. Step cards ---------- */

// Builds one blank step card and adds it to the Steps panel.
// The text here is fixed (no user input), so innerHTML with a template is safe.
/*



function addStepCard() {
    const number = stepsList.children.length + 1;   // how many cards exist, plus one
    const card = makeEl('div', 'step-card');

    card.innerHTML = `
        <h2 class="step-heading">Step ${number}</h2>
        <label>Step Name
            <input type="text" class="step-name" placeholder="Enter step name">
        </label>
        <label>Instruction
            <textarea class="step-instruction" placeholder="Enter instructions..."></textarea>
        </label>
        <label>Timer (Optional)
            <div class="timer-row">
                <input type="number" class="timer-hours" min="0" value="0" aria-label="Timer hours"> hours :
                <input type="number" class="timer-minutes" min="0" max="59" value="0" aria-label="Timer minutes"> min :
                <input type="number" class="timer-seconds" min="0" max="59" value="0" aria-label="Timer seconds"> sec
            </div>
        </label>
        <label>Extra Notes (optional)
            <textarea class="step-notes" placeholder="Enter notes..."></textarea>
        </label>
    `;

    stepsList.appendChild(card);
}

// LISTEN: the big "+ Add Step" button adds another card
addStepBtn.addEventListener('click', addStepCard);

// Start with one card already on the page
addStepCard();


/* ------ 3. Saving ----- */

// Reads a number from an input inside a card; falls back to 0 if it is empty
function readNumber(card, selector) {
    return Number(card.querySelector(selector).value) || 0;
}

// Looks at every step card and turns each into an object like the ones in recipes.js
function collectSteps() {
    const cards = Array.from(stepsList.querySelectorAll('.step-card'));

    const steps = cards.map(function (card) {
        return {
            name:        card.querySelector('.step-name').value.trim(),
            instruction: card.querySelector('.step-instruction').value.trim(),
            timer: {
                hours:   readNumber(card, '.timer-hours'),
                minutes: readNumber(card, '.timer-minutes'),
                seconds: readNumber(card, '.timer-seconds')
            },
            notes: card.querySelector('.step-notes').value.trim()
        };
    });

    // Drop any card the user left completely blank
    return steps.filter(function (step) {
        return step.name !== '' || step.instruction !== '';
    });
}

// Shows a message under the button; type is 'success' or 'error' (picks the colour)
function showMessage(text, type) {
    saveMessage.textContent = text;
    saveMessage.className = 'message ' + type;
}

// LISTEN: when Save is pressed...
saveBtn.addEventListener('click', function () {

    const title = document.getElementById('recipe-name').value.trim();

    // Validate first: a recipe needs a name
    if (title === '') {
        showTab('details');                                // take them to the missing field
        document.getElementById('recipe-name').focus();
        showMessage('Please enter a recipe name.', 'error');
        return;                                            // stop here, nothing is saved
    }

    const steps = collectSteps();




   /*herr




   
    // Total time = every step's timer added together, rounded up to whole minutes
    let totalSeconds = 0;
    steps.forEach(function (step) {
        totalSeconds += step.timer.hours * 3600 + step.timer.minutes * 60 + step.timer.seconds;
    });

    const newRecipe = {
        id: Date.now().toString(),       // the current time in ms: a simple unique id
        title: title,
        description: document.getElementById('recipe-description').value.trim(),
        servings: document.getElementById('recipe-servings').value.trim(),
        minutes: Math.ceil(totalSeconds / 60),
        image: null,                     // photo upload comes later
        favourite: false,
        lastOpened: null,
        steps: steps
    };

    // Load the list, add the new recipe, save the list again
    const recipes = loadRecipes();
    recipes.push(newRecipe);
    saveRecipes(recipes);

    showMessage('Recipe saved!', 'success');

    // Pause for a second so the message can be read, then go to the Recipe Book
    setTimeout(function () {
        window.location.href = 'recipe-book.html';
    }, 1000);
});

// TODO (next stage): Edit Recipe links here as add-recipe.html?edit=<id>.
// Read it with new URLSearchParams(window.location.search).get('edit'),
// fill the fields, and replace that recipe instead of pushing a new one.
