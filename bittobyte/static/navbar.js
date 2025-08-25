/* ------- JAVASCRIPT FOR THE HOME PAGE ------- */

// Navbar event listeners
const hamburgerMenu = document.querySelector('.hamburger-menu'); // Retrieve div element
const sideNavigationMenu = document.querySelector('.side-bar--header');

// Add click listener to DOM element
// Toggle "active" class name to DOM element after every click
hamburgerMenu.addEventListener('click', () => {
    hamburgerMenu.classList.toggle('active');
    sideNavigationMenu.classList.toggle('active');

});