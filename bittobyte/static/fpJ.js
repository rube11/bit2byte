/* ------ HANDLE CAROUSEL ANIMATIONS AND INDEXING ------ */
const slider = document.querySelectorAll('.carousel-container--card'); // array of .card elements
const prev = document.querySelector('.carousel-btns--prev');
const next = document.querySelector('.carousel-btns--next');

const OFFSET_PX = 160;
// let currIdx = Math.floor(slider.length / 2);
let currIdx = 0;
let length = slider.length;
const sliderShow = () => {

    slider[currIdx].style.transform = `translate(0, -50%)`;
    slider[currIdx].style.zIndex = 1;
    slider[currIdx].style.filter = "none";
    slider[currIdx].style.opacity  = 1;


    slider.forEach((card, i) => {
        /* FORMULA
        *   - offset = (currIdx - i + length) % length;
        *       - ... + length) % length to ensure offset is always in bounds
        *   - if offset > length/2 then offset -= length
        */

        // console.log(`i: ${i }  currIdx - i + length: ${currIdx - i + length}
        // currIdx - i + length % 7: ${(currIdx - i + length) % 7}`);

        let offset = (i - currIdx + length) % length; // Right side offset
        console.log(`offset: ${offset} length/2: ${Math.floor(length/2)}`)
        if(offset > Math.floor(length/2)) offset -= length; // Left side offset

        console.log(`x translate: ${OFFSET_PX * offset}`);
        if(i != currIdx) {

          
            card.style.transform = `
                translate(${OFFSET_PX * offset}px, -50%)
                scale(${1-.2*Math.abs(offset)})
                perspective(20px)
                rotateY(${offset < 0 ? '1deg' : '-1deg'})
                
            `;
            card.style.filter = "brightness(70%)";
            card.style.zIndex = `${offset < 0 ? offset : -offset}`;
            
        }

        


    });
}
sliderShow();

next.addEventListener('click', (e) => {
    currIdx = (currIdx + 1) % slider.length;
    sliderShow();
    
});

prev.addEventListener('click', (event) => {
    currIdx = (currIdx - 1 + slider.length) % slider.length;
    sliderShow();
});





