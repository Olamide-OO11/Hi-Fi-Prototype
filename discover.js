/*   jAVASCRIPT FOR  Discover page aka index.html (relating to mid-fi) 
    Select(1) -> Build(2) -> Add to the page(3): 
    (1) Finds the empty box document.getElementById('discover-list'). and Reads the data: the recipes are in recipes.js, in the discoverRecipes array and forEach loop goes through them one at a time.
   (2+3) Builds and inserts a card for each: with the image, name and time, then appendChild puts each one into the box.
   */

// 1. SELECTs the empty container of index.html file from the div element
const discoverList = document.getElementById('discover-list');

// 2. BUILDs one card per recipe where forEach loop runs the function once for each item in the array with "recipe" as the current item.
//uses variables below from recipe.js if lost
discoverRecipes.forEach(function (recipe) {
    const card = makeEl('article', 'recipe-card');

// Grey box with  photo inside (organised in recipe.js) - helps since there's no image attributed yet
    const imageBox = makeEl('div', 'image-box');
    const image = document.createElement('img');
    image.src = recipe.image;
    image.alt = recipe.title;

// error handling - missing image file ; code below hides broken image icon and then the css shows the grey box of the outline it'd be placed in)
    image.addEventListener('error', function () {
        image.classList.add('img-missing');
    });
    imageBox.appendChild(image);

    // Name on the left, time on the right just like the mid-fi does
    const metadata = makeEl('div', 'recipe-card__meta');
    metadata.appendChild(makeEl('span', '', recipe.title));
    metadata.appendChild(makeEl('span', '', recipe.minutes + ' min'));

    card.appendChild(imageBox);
    card.appendChild(meta);

    // 3. adds the finished card to the page
    discoverList.appendChild(card);
});
