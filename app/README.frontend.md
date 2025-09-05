# Code Documentation


## App

The entry point for the application that initializes basic functionality.
It uses a page registry to create page classes when navigating to pages.
It tracks the pages by `data-template` which acts as a key for updating the registry page system.
It sets up the router, link listeners for page navigation handling, and preloader animation for initial page load. 


## Router

For the SPA implementation, the router hijacks the default link click event, uses fetch to load and replace the page content and sets history API push state for updating the url.

It also updates the page/url for hard refreshes edge cases, toggles page classes to be consistent with the page registry system, sets up named routes and helper functions to ensure the correct page file is fetched.

- Had to use Promise.all() to wait for all the images to load before resolving the updateMarkup method

- Used ResizeObserver to resolve once the layout calculations were complete once the replaceChildren method was called for the new page

## Smooth Scroll

Smooth scroll creates a smooth buttery flow when scrolling the page.
This is achieved by hijacking the browsers native scrolling.
Set the smooth scroll container, the wrapper around the content to `position: fixed` and `overflow: hidden`.
Set the smooth scroll content, the scrollable content to `transform: translateY()`.

The container styles prevents scrolling. The content styles updates the transform property which is determined by using the lerp formula to achieve the smooth scroll effect.

Tracking the current page position, the future target position, and the page limit (content height) updates the scroll position using the mousewheel event. Listening for the mousewheel event updates the target, which triggers a smooth scroll update function that is called on every RAF tick for browser performance.

It's important to prevent the scroll from going beyond the actual content height.
On each new page change, the content height needs to be recalculated to ensure only the content is scrollable.
If not, scrolling with go beyond the content.



## Preloader

Displays initial page loading animation, checks for images to load and updates the UI with a loading percentage then hides.


## Page

Bae class for the page objects. Implements basic page functionality for showing/hiding animations on page changes, intializes page functionality like smooth scroll. Actual pages extend from this class such as About.js -> pages/about.html.

## Component

Accepts selector strings for `querySelector` and `querySelectorAll` and takes actual DOM elements for flexibility.
This class creates an object of names to selector/elements to create a simple selector API to target elements within javascript.

`this.elements.title` can be called by passing in `{elements: { title: "h1" }}`.

The base class for components that inherits from EventTarget class for basic event dispatching.


## Animation

This class extends the component class for selecting elements. CSS Transition, Animation key-frame, and GSAP based animations can be created as stand alone methods to be called from Page.js or the page classes to overide the Page.js class. An IntersectionObserver method can be called from animation classes that extend the parent Animation class, see Titles.js. 


1. Set a `data-animation="animiation-name` on an element to trigger an animation using the IntersectionObserver.
2. Create the animation object for the animation-name in Page.js.
3. Create the animation class to set the GSAP animation settings for the animation-name and call createIntersectionObserver() in the constructor to initalize a window based animation.
