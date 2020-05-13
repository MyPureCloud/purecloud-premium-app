/**
 * A heavily modified version of the code from this tutorial: 
 * https://medium.com/@marcusmichaels/how-to-build-a-carousel-from-scratch-in-vanilla-js-9a096d3b98c9
 */

// Variables to target our base class,  get carousel items, count how many carousel items there are, set the slide to 0 (which is the number that tells us the frame we're on), and set motion to true which disables interactivity.
let itemClassName = 'carousel-item';
let navContainerClass = 'carousel-circles';
let navCircleClass = 'carousel-circle';
let items = null;
let navCircles = null;
let totalItems = null;
let slide = 0;
let moving = true;
let autoplayTimeout = 4000; 
let timer = null;

// To initialise the carousel we'll want to update the DOM with our own classes
function setInitialClasses() {
    // Target the last, initial, and next items and give them the relevant class.
    // This assumes there are three or more items.
    items[totalItems - 1].classList.add("prev");
    items[0].classList.add("active");
    items[1].classList.add("next");
}

// Disable interaction by setting 'moving' to true for the same duration as our transition (0.5s = 500ms)
function disableInteraction() {
    moving = true;

    setTimeout(function () {
        moving = false
    }, 500);
}

function moveCarouselTo(newSlide) {
    // Reset autoplay timer
    resetTimer();

    slide = newSlide;
    // Check if carousel is moving, if not, allow interaction
    if (!moving) {
        // temporarily disable interactivity
        disableInteraction();

        // Everytime it moves, also update the navs
        for(let i = 0; i < navCircles.length; i++){
            navCircles[i].classList.remove('active');
        }
        navCircles[slide].classList.add('active');

        // Preemptively set variables for the current next and previous slide, as well as the potential next or previous slide.
        var newPrevious = slide - 1,
            newNext = slide + 1,
            oldPrevious = slide - 2,
            oldNext = slide + 2;

        // Checks if the new potential slide is out of bounds and sets slide numbers
        if (newPrevious <= 0) {
            oldPrevious = (totalItems - 1);
        } else if (newNext >= (totalItems - 1)) {
            oldNext = 0;
        }

        // Check if current slide is at the beginning or end and sets slide numbers
        if (slide === 0) {
            newPrevious = (totalItems - 1);
            oldPrevious = (totalItems - 2);
            oldNext = (slide + 1);
        } else if (slide === (totalItems - 1)) {
            newPrevious = (slide - 1);
            newNext = 0;
            oldNext = 1;
        }
        // Now we've worked out where we are and where we're going, by adding and removing classes, we'll be triggering the carousel's transitions.

        // Based on the current slide, reset to default classes.
        items[oldPrevious].className = itemClassName;
        items[oldNext].className = itemClassName;

        // Add the new classes
        items[newPrevious].className = itemClassName + " prev";
        items[slide].className = itemClassName + " active";
        items[newNext].className = itemClassName + " next";
    }
}

// Next navigation handler
function moveNext() {
    // Check if moving
    if (!moving) {
        // If it's the last slide, reset to 0, else +1
        if (slide === (totalItems - 1)) {
            slide = 0;
        } else {
            slide++;
        }

        // Move carousel to updated slide
        moveCarouselTo(slide);
    }
}

// Previous navigation handler
function movePrev() {
    // Check if moving
    if (!moving) {

        // If it's the first slide, set as the last slide, else -1
        if (slide === 0) {
            slide = (totalItems - 1);
        } else {
            slide--;
        }

        // Move carousel to updated slide
        moveCarouselTo(slide);
    }
}

function createNavCircles(){
    let container = document.querySelectorAll('.'+navContainerClass)[0];

    // Remove them circles first
    while(container.firstChild){
        container.firstChild.remove();
    }


    // Create the elements and add to continaer
    for(let i = 0; i < totalItems; i++){
        let newCircle = document.createElement('button');
        newCircle.classList.add(navCircleClass);

        if(i == 0) newCircle.classList.add('active');

        // Set event listener for when it's clicked
        newCircle.addEventListener('click', () => {
            moveCarouselTo(i);
        });

        container.appendChild(newCircle)
    }

    navCircles = document.getElementsByClassName(navCircleClass);
}

function resetTimer(){
    if(timer){
        clearTimeout(timer);
    }
    timer = setTimeout(() => {
        moveNext();
    }, autoplayTimeout);
}

// Initialise carousel
function initCarousel() {
    // Reassign variables
    items = document.getElementsByClassName(itemClassName);
    totalItems = items.length;

    setInitialClasses();
    createNavCircles();
    resetTimer();

    // Set moving to false now that the carousel is ready
    moving = false;
}

export default {
    initCarousel: initCarousel
}