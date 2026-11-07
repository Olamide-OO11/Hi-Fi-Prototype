const button = document.getElementById('myBtn'); 
const heading = document.querySelector('h1');
// explain code
button.addEventListener('click', function() {
    heading.textContent = 'Awesome! Everything is linked!';
    heading.style.color = '#28a745';
});
