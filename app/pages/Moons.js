import Page from "../classes/Page.js";
import { gsap } from "gsap/index.js";

export class Moons extends Page {
  constructor() {
    super({
      id: "moons",
      element: ".moons",
      transitionOverlay: ".transition-overlay",
      elements: {
        wrapper: ".page-content",
        containerOne: ".container1",
        containerTwo: ".container2",
        containerThree: ".container3",
        containerFour: ".container4",
      },
    });

  }

  create() {
    super.create({ isScrollSmooth: true });
    this.animateColumns();
  }

  animateColumns() {
    let incr = 0;
    console.log("animateColumns");
    console.log(this.elements);
    // this.elements.containerOne = document.querySelector(".container1");
    // this.elements.containerTwo = document.querySelector(".container2");
    // this.elements.containerThree = document.querySelector(".container3");
    // this.elements.containerFour = document.querySelector(".container4");
    // console.log(this.elements.containerOne, this.elements.containerTwo, this.elements.containerThree, this.elements.containerFour);
    
    // Using documents
    const col1 = document.querySelector(".moons .container1");
    console.log(col1);
    // Half of the total height of the column
    const half1 = col1.clientHeight / 2;
    const wrap1 = gsap.utils.wrap(-half1, 0);
    const yTo1 = gsap.quickTo(col1, "y", {
      duration: 0.5, // Changes over 0.5s
      ease: "power3", // Non-linear
      modifiers: {
        y: gsap.utils.unitize(wrap1),
      },
    });

    const col2 = document.querySelector(".moons .container2");
    // Half of the total height of the column
    const half2 = col2.clientHeight / 2;
    const wrap2 = gsap.utils.wrap(-half2, 0);
    const yTo2 = gsap.quickTo(col2, "y", {
      duration: 0.8, // Changes over 0.8s
      ease: "power3", // Non-linear
      modifiers: {
        y: gsap.utils.unitize(wrap2),
      },
    });

    const col3 = document.querySelector(".moons .container3");
    // Half of the total height of the column
    const half3 = col3.clientHeight / 2;
    const wrap3 = gsap.utils.wrap(-half3, 0);
    const yTo3 = gsap.quickTo(col3, "y", {
      duration: 0.6, // Changes over 0.6s
      ease: "power3", // Non-linear
      modifiers: {
        y: gsap.utils.unitize(wrap3),
      },
    });

    const col4 = document.querySelector(".moons .container4");
    // Half of the total height of the column
    const half4 = col4.clientHeight / 2;
    const wrap4 = gsap.utils.wrap(-half4, 0);
    const yTo4 = gsap.quickTo(col4, "y", {
      duration: 0.2, // Changes over 0.2s
      ease: "power3", // Non-linear
      modifiers: {
        y: gsap.utils.unitize(wrap4),
      },
    });

    window.addEventListener(
      "wheel",
      (e) => {
        incr += e.deltaY / 2; // Dividing by 2 to slow down the movement
        yTo1(incr);
        yTo2(incr);
        yTo3(incr);
        yTo4(incr);
      },
      { passive: true }
    );
  }
}
