/* 
   recipe-book.js | Recipe Book page
   Pattern: keep the data in a variable, then call
   renderList() to redraw the page whenever it changes.
 */

// ---------- SELECT ----------
const bookList   = document.getElementById('book-list');
const filterTabs = document.querySelectorAll('.tab');

// ---------- STATE: the two things that can change ----------
let recipes = loadRecipes();     // the saved list (let, because we may reassign it)
let currentFilter = 'all';       // 'all', 'recents' or 'favourites'


/* ---------- Which recipes should show? ---------- */
function getVisibleRecipes() {
    if (currentFilter === 'favourites') {
        return recipes.filter(function (recipe) { return recipe.favourite; });
    }
    if (currentFilter === 'recents') {
        return recipes
            .filter(function (recipe) { return recipe.lastOpened; })        // only ones we have opened
            .sort(function (a, b) { return b.lastOpened - a.lastOpened; }); // newest first
    }
    return recipes;
}

// Text shown when a tab has nothing in it
function emptyText() {
    if (currentFilter === 'favourites') return 'No favourites yet. Tap the heart on a recipe.';
    if (currentFilter === 'recents')    return 'Nothing here yet. Recipes you start cooking will appear here.';
    return 'No recipes yet. Add one from the Add Recipe tab.';
}


/* ---------- Build one recipe card ---------- */
function buildCard(recipe) {

    const card = makeEl('article', 'book-card');

    // Left: photo box
    const imageBox = makeEl('div', 'book-card__img');
    if (recipe.image) {
        const image = document.createElement('img');
        image.src = recipe.image;
        image.alt = '';                                  // the title beside it already names the recipe
        image.addEventListener('error', function () { image.classList.add('img-missing'); });
        imageBox.appendChild(image);
    }

    // Right: title + heart, three actions, hidden details



   /*workign still on here


       
    const main = makeEl('div', 'book-card__main');
    const head = makeEl('div', 'book-card__head');
    head.appendChild(makeEl('span', '', recipe.title));

    // Heart button: flips favourite, saves, redraws. The arrow function remembers
    // which "recipe" it was created for (that is called a closure).
    const heart = makeEl('button', 'heart-btn');
    heart.type = 'button';
    heart.setAttribute('aria-label', 'Favourite ' + recipe.title);
    heart.setAttribute('aria-pressed', recipe.favourite);
    heart.appendChild(makeIcon(recipe.favourite ? 'fa-solid fa-heart' : 'fa-regular fa-heart'));
    heart.addEventListener('click', function () {
        recipe.favourite = !recipe.favourite;            // true becomes false and vice versa
        saveRecipes(recipes);
        renderList();
    });
    head.appendChild(heart);

    // Details box, hidden until "View recipe details" is pressed
    const details = makeEl('div', 'recipe-details');
    details.hidden = true;
    if (recipe.description) details.appendChild(makeEl('p', '', recipe.description));
    const stepList = makeEl('ol');
    recipe.steps.forEach(function (step) {
        let text = step.name || 'Untitled step';
        if (formatTimer(step.timer)) text += ' (' + formatTimer(step.timer) + ')';
        stepList.appendChild(makeEl('li', '', text));
    });
    details.appendChild(stepList);

    // Action 1: Start Cooking (a link to the cooking page, passing the recipe id in the URL)
    const start = makeEl('a', 'book-action');
    start.href = 'cooking.html?id=' + encodeURIComponent(recipe.id);
    start.appendChild(makeEl('span', '', 'Start Cooking'));
    start.appendChild(makeIcon('fa-solid fa-play'));
    start.addEventListener('click', function () {
        recipe.lastOpened = Date.now();                  // remember it for the Recents tab
        saveRecipes(recipes);                            // the link still carries on to cooking.html
    });

    // Action 2: View recipe details (shows or hides the box above)
    const view = makeEl('button', 'book-action');
    view.type = 'button';
    view.appendChild(makeEl('span', '', 'View recipe details'));
    view.appendChild(makeIcon('fa-solid fa-list'));
    view.addEventListener('click', function () {
        details.hidden = !details.hidden;
    });

    // Action 3: Edit Recipe (page exists, prefilling is the TODO in add-recipe.js)
    const edit = makeEl('a', 'book-action');
    edit.href = 'add-recipe.html?edit=' + encodeURIComponent(recipe.id);
    edit.appendChild(makeEl('span', '', 'Edit Recipe'));
    edit.appendChild(makeIcon('fa-regular fa-pen-to-square'));




   /*



   
    const actions = makeEl('div', 'book-actions');
    actions.appendChild(start);
    actions.appendChild(view);
    actions.appendChild(edit);

    main.appendChild(head);
    main.appendChild(actions);
    main.appendChild(details);

    card.appendChild(imageBox);
    card.appendChild(main);
    return card;
}


/* ---------- Draw the whole list ---------- */
function renderList() {
    bookList.innerHTML = '';                             // clear what is there now

    const visible = getVisibleRecipes();

    if (visible.length === 0) {
        bookList.appendChild(makeEl('p', 'empty-message', emptyText()));
        return;
    }

    visible.forEach(function (recipe) {
        bookList.appendChild(buildCard(recipe));
    });
}


/* ---------- Tabs: All / Recents / Favourites ---------- */
filterTabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
        currentFilter = tab.dataset.filter;              // read data-filter from the HTML
        filterTabs.forEach(function (other) {
            other.setAttribute('aria-pressed', other === tab);
        });
        renderList();
    });
});

// First draw when the page loads
renderList();
