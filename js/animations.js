// Register ONLY the plugins you actually loaded from the CDN.
gsap.registerPlugin(ScrollTrigger, Draggable);

const phones = gsap.utils.toArray(".draggable-phone");

// 1. Place all 4 phones in a straight horizontal line, evenly spaced, centered.
//    left/top + xPercent/yPercent centers each phone; x offsets them into a row.
gsap.set(phones, {
  left: "50%",
  top: "50%",
  xPercent: -50,
  yPercent: -50,
  // 4 phones: offsets are -420, -140, +140, +420 (spacing 280px)
  x: (i) => (i - (phones.length - 1) / 2) * 280,
  y: 120,                       // start below final position for the entrance
  opacity: 0,
  rotation: (i, el) => parseFloat(el.dataset.rot || "0")
});

// 2. Staggered entrance — rise + fade in when the arena scrolls into view
gsap.to(phones, {
  scrollTrigger: {
    trigger: ".phones-arena",
    start: "top 80%",
    toggleActions: "play none none reverse"
  },
  y: 0,
  opacity: 1,
  duration: 1.2,
  ease: "power3.out",
  stagger: 0.15
});

// 3. Make every phone click-and-drag, locked inside .phones-arena
Draggable.create(phones, {
  type: "x,y",
  bounds: ".phones-arena",
  edgeResistance: 0.65,
  onPress() {
    // lift above the OTHER phones but stay BELOW the text (z-index 20)
    gsap.set(this.target, { zIndex: 15 });
    gsap.to(this.target, { scale: 1.05, duration: 0.2 });
  },
  onRelease() {
    gsap.to(this.target, { scale: 1, duration: 0.2, delay: 0.1 });
    gsap.set(this.target, { zIndex: 5 });   // drop back below text
  }
});

// 4. Optional rotating ad screenshots (remove if you use video)
const ads = ["Screenshot1.png", "Screenshot2.png", "Screenshot3.png", "Screenshot4.png"];
let index = 0;
setInterval(() => {
  index = (index + 1) % ads.length;
  gsap.to(".ad-image", {
    opacity: 0,
    duration: 0.4,
    onComplete() {
      document.querySelectorAll(".ad-image").forEach((img) => { img.src = ads[index]; });
      gsap.to(".ad-image", { opacity: 1, duration: 0.4 });
    }
  });
}, 3500);


// ─── SECTION MORPHING (free path-attribute tween) ───
gsap.registerPlugin(ScrollTrigger); // already registered; safe to repeat

// Define the END shape for each divider.
// Keep point count identical to the start shape in the HTML.
const morphTargets = {
  // Philosophy → Services: ends as a sharper zig-zag wave
  "M0,40 C150,90 300,10 600,70 C900,130 1050,20 1200,80 L1200,120 L0,120 Z": null,
  // Services → Process: ends as a rounded hill
  "M0,80 C200,20 400,100 600,40 C800,100 1000,20 1200,80 L1200,120 L0,120 Z": null
};

document.querySelectorAll("[data-morph]").forEach((divider) => {
  const path = divider.querySelector(".morph-path");
  const startD = path.getAttribute("d");

  // Pick a target shape — alternate so adjacent dividers differ
  const targets = Object.keys(morphTargets);
  const endD = targets[gsap.utils.random(0, targets.length - 1, 1)];

  gsap.to(path, {
    scrollTrigger: {
      trigger: divider,
      start: "top 85%",
      end:   "bottom 30%",
      scrub: true                 // morph tied to scroll, not a one-shot play
    },
    attr: { d: endD },            // tween the path's d attribute
    ease: "none"                  // linear feels right for scrubbed scroll morphs
  });
});
