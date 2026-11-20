/* 
   cooking.js | placeholder cooking page
   Shows how a page receives data from a link:
   recipe-book.js sends cooking.html?id=burger and we read the "id" back.
 */

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
