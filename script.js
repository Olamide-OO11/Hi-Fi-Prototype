const button = document.getElementById('myBtn'); 
const heading = document.querySelector('h1');


button.addEventListener('click', function() {
    heading.textContent = 'Awesome Everything is linked!';
    heading.style.color = '#28a745';
});
