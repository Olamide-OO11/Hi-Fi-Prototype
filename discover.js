/* =====================================================
   discover.js | Discover page
   Pattern: Select -> Build -> Add to the page
   ===================================================== */

// 1. SELECT the empty container from index.html
const discoverList = document.getElementById('discover-list');

// 2. BUILD one card per recipe. forEach runs the function once for each item
//    in the array, and "recipe" is the current item.
discoverRecipes.forEach(function (recipe) {

    const card = makeEl('article', 'recipe-card');

    // Grey box with the photo inside
    const imageBox = makeEl('div', 'image-box');
    const image = document.createElement('img');
    image.src = recipe.image;
    image.alt = recipe.title;

    // If the image file is missing, hide the broken-image icon (CSS shows the grey box)
    image.addEventListener('error', function () {
        image.classList.add('img-missing');
    });
    imageBox.appendChild(image);

    // Name on the left, time on the right (as in the mid-fi)
    const meta = makeEl('div', 'recipe-card__meta');
    meta.appendChild(makeEl('span', '', recipe.title));
    meta.appendChild(makeEl('span', '', recipe.minutes + ' min'));

    card.appendChild(imageBox);
    card.appendChild(meta);

    // 3. ADD the finished card to the page
    discoverList.appendChild(card);
});
