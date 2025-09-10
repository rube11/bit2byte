/* ------ HANDLE CAROUSEL ANIMATIONS AND INDEXING ------ */
const slider = document.querySelectorAll('.card'); // array of .card elements
const prev = document.querySelector('.carousel-btns--prev');
const next = document.querySelector('.carousel-btns--next');

let currIdx = Math.floor(slider.length / 2);
console.log("curridx: " + currIdx);
const sliderShow = () => {

    slider[currIdx].style.transform = `translate(0, -50%)`;
    slider[currIdx].style.zIndex = 1;
    slider[currIdx].style.filter = "none";
    slider[currIdx].style.opacity  = 1;
    

    for(let i = currIdx + 1; i < slider.length; ++i) {
        let offset = i - currIdx;

        // Translate to the x direction to the right
        // Translate 50% of the elements own height
        slider[i].style.transform = `translate(${160*offset}px,-50%) 
        scale(${1-.2*offset})
        perspective(20px)
        rotateY(-1deg)`;

        slider[i].style.zIndex = `${-offset}`;
        slider[i].style.filter = "brightness(70%)"
        slider[i].style.opacity = offset > 2 ? 0 : 1;
    }


    counter = 0;
    for(let i = currIdx - 1; i >= 0; --i) {
        let offset = currIdx - i;

        // Translate to the x direction to the right
        // Translate 50% of the elements own height
        slider[i].style.transform = `translate(${-160*offset}px,-50%) 
        scale(${1-.2*offset})
        perspective(20px)
        rotateY(1deg)`;

        slider[i].style.zIndex = `${-offset}`;
        slider[i].style.filter = "brightness(70%)"
        slider[i].style.opacity = offset > 2 ? 0 : 1;
    }
}
sliderShow();

next.addEventListener('click', (e) => {
    if(currIdx == 6) return;

    ++currIdx;
    sliderShow();
    
});

prev.addEventListener('click', (event) => {
    if(currIdx == 0) return;

    --currIdx;
    sliderShow();
});





