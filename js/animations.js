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


// ==========================================
// FILM REEL – JESPER STYLE
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  const strip = document.getElementById('reel-strip');
  if (!strip) return;

  const frames = gsap.utils.toArray('.reel-frame');
  const totalFrames = frames.length;
  const halfFrames = totalFrames / 2;

  // ─── 1. SCROLL-DRIVEN ROTATION ───
  // The strip rotates horizontally as you scroll
  gsap.to(strip, {
    x: -strip.scrollWidth / 2, // Move half the strip width
    ease: 'none',
    scrollTrigger: {
      trigger: '.film-reel-section',
      scrub: 2, // Smooth, draggy feel
      start: 'top bottom',
      end: 'bottom top',
      invalidateOnRefresh: true
    },
    modifiers: {
      x: (x) => {
        // Seamless loop: reset when we've moved half the strip
        const halfWidth = strip.scrollWidth / 2;
        return parseFloat(x) % -halfWidth;
      }
    }
  });

  // ─── 2. 3D CURVATURE ───
  // Each frame gets a Y rotation based on its position in the strip
  // This creates the "film reel" curve effect
  function applyCurve() {
    const rect = strip.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;

    frames.forEach((frame, i) => {
      const frameRect = frame.getBoundingClientRect();
      const frameCenterX = frameRect.left + frameRect.width / 2;
      const offset = (frameCenterX - centerX) / (rect.width / 2);
      
      // Clamp and map to rotation: -45deg to +45deg
      const clamped = Math.max(-1, Math.min(1, offset));
      const rotationY = clamped * 40; // Max 40 degrees of curve
      
      gsap.set(frame, {
        rotationY: rotationY,
        z: -Math.abs(clamped) * 30, // Push back at edges
        transformPerspective: 800
      });
    });
  }

  // Apply curve on load, scroll, and resize
  applyCurve();
  window.addEventListener('scroll', applyCurve);
  window.addEventListener('resize', applyCurve);

  // ─── 3. CURSOR TRACKING FOR HOVER ───
  // Make individual frames tilt toward the cursor
  frames.forEach((frame) => {
    frame.addEventListener('mousemove', (e) => {
      const rect = frame.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5; // -0.5 to 0.5
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      
      // Subtle tilt: max 8 degrees
      const rotY = x * 16;
      const rotX = -y * 10;
      const translateZ = 40 + Math.abs(x) * 30;
      
      gsap.to(frame, {
        rotationY: rotY,
        rotationX: rotX,
        z: translateZ,
        duration: 0.15,
        ease: 'power1.out',
        overwrite: 'auto'
      });
    });

    frame.addEventListener('mouseleave', () => {
      // Reset to the scroll-driven curve position
      gsap.to(frame, {
        rotationY: 0,
        rotationX: 0,
        z: 0,
        duration: 0.4,
        ease: 'power2.out'
      });
      // Re-apply the curve after reset
      setTimeout(applyCurve, 400);
    });
  });

  // ─── 4. AUTO-PLAY PAUSE ON HOVER ───
  const section = document.getElementById('film-reel');
  section.addEventListener('mouseenter', () => {
    // Pause scroll-triggered animation if needed
    ScrollTrigger.getById('reel-scroll')?.pause();
  });
  section.addEventListener('mouseleave', () => {
    ScrollTrigger.getById('reel-scroll')?.resume();
  });
});



<!-- GSAP -->
<script src="https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/gsap.min.js"></script>

<!-- GSAP ScrollTrigger -->
<script src="https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/ScrollTrigger.min.js"></script>


/* ═══════════════════════════════════════════════════════
   SEASCAPE GSAP PARALLAX + TRAILING SYSTEM
   ═══════════════════════════════════════════════════════ */

document.addEventListener("DOMContentLoaded", () => {

  if (typeof gsap === "undefined") {
    console.warn("GSAP is not loaded.");
    return;
  }

  if (typeof ScrollTrigger === "undefined") {
    console.warn("GSAP ScrollTrigger is not loaded.");
    return;
  }

  gsap.registerPlugin(ScrollTrigger);


  /* =====================================================
     1. SCROLL PARALLAX
     ===================================================== */

  const parallaxLayers = gsap.utils.toArray(
    "#seascape-transition [data-speed]"
  );

  parallaxLayers.forEach((layer) => {

    const speed = parseFloat(layer.dataset.speed) || 1;

    /*
      Higher data-speed = more movement.
      The movement is intentionally subtle so the effect
      feels premium rather than like a conventional
      scrolling website animation.
    */

    const movement = (speed - 1) * 100;

    gsap.fromTo(
      layer,
      {
        y: -movement
      },
      {
        y: movement,
        ease: "none",

        scrollTrigger: {
          trigger: "#seascape-transition",

          start: "top bottom",
          end: "bottom top",

          scrub: 1.2
        }
      }
    );

  });


  /* =====================================================
     2. ORBIT / DEPTH ROTATION
     ===================================================== */

  gsap.to(".transition-orbit", {
    rotation: 8,
    duration: 18,
    ease: "none",
    repeat: -1
  });


  /* =====================================================
     3. GRID DRIFT
     ===================================================== */

  gsap.to(".transition-grid", {
    backgroundPosition: "90px 90px",
    duration: 12,
    ease: "none",
    repeat: -1
  });


  /* =====================================================
     4. CURSOR TRAILING EFFECT
     ===================================================== */

  const trail = gsap.utils.toArray(
    ".cursor-trail span"
  );

  const transition = document.querySelector(
    "#seascape-transition"
  );

  if (!transition || !trail.length) return;

  let mouseX = 0;
  let mouseY = 0;

  let currentX = 0;
  let currentY = 0;

  transition.addEventListener("pointermove", (event) => {

    const rect = transition.getBoundingClientRect();

    mouseX = event.clientX - rect.left;
    mouseY = event.clientY - rect.top;

  });


  /* Smooth cursor position */
  gsap.ticker.add(() => {

    currentX += (mouseX - currentX) * 0.15;
    currentY += (mouseY - currentY) * 0.15;

    gsap.set(trail[0], {
      x: currentX,
      y: currentY,
      opacity: 1,
      scale: 1
    });

  });




  /* =====================================================
     5. BETTER TRAIL IMPLEMENTATION
     ===================================================== */

  let trailPositions = trail.map(() => ({
    x: 0,
    y: 0
  }));

  gsap.ticker.add(() => {

    trailPositions[0].x +=
      (mouseX - trailPositions[0].x) * 0.25;

    trailPositions[0].y +=
      (mouseY - trailPositions[0].y) * 0.25;


    for (let i = 1; i < trailPositions.length; i++) {

      trailPositions[i].x +=
        (trailPositions[i - 1].x - trailPositions[i].x) *
        0.22;

      trailPositions[i].y +=
        (trailPositions[i - 1].y - trailPositions[i].y) *
        0.22;

    }


    trail.forEach((particle, index) => {

      const position = trailPositions[index];

      const scale =
        1 - (index / trail.length) * 0.7;

      const opacity =
        1 - (index / trail.length) * 0.85;

      gsap.set(particle, {
        x: position.x,
        y: position.y,
        scale,
        opacity
      });

    });

  });


  /* =====================================================
     6. ENTER / EXIT FADE
     ===================================================== */

  gsap.from(".transition-content", {

    opacity: 0,
    x: -30,

    scrollTrigger: {
      trigger: "#seascape-transition",
      start: "top 80%",
      end: "top 45%",
      scrub: true
    }

  });


  /* =====================================================
     7. REFRESH SCROLLTRIGGER
     ===================================================== */

  window.addEventListener("load", () => {
    ScrollTrigger.refresh();
  });

});


