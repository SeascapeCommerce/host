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


// ------- Osmo [https://osmo.supply/] ------- //

document.addEventListener('DOMContentLoaded', function () {
  const animationStepDuration = 0.3; // Adjust this value to control the timing
  const gridSize = 7; // Number of pixels per row and column (adjustable)
  // Calculate pixel size dynamically
  const pixelSize = 100 / gridSize; // Calculate the size of each pixel as a percentage
  // Select all cards
  const cards = document.querySelectorAll('[data-pixelated-image-reveal]');
  // Detect if device is touch device
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0 || window.matchMedia("(pointer: coarse)").matches;
  // Loop through each card
  cards.forEach((card) => {
    const pixelGrid = card.querySelector('[data-pixelated-image-reveal-grid]');
    const activeCard = card.querySelector('[data-pixelated-image-reveal-active]');
    // Remove any existing pixels with the class 'pixelated-image-card__pixel'
    const existingPixels = pixelGrid.querySelectorAll('.pixelated-image-card__pixel');
    existingPixels.forEach(pixel => pixel.remove());
    // Create a grid of pixels dynamically based on the gridSize
    for (let row = 0; row < gridSize; row++) {
      for (let col = 0; col < gridSize; col++) {
        const pixel = document.createElement('div');
        pixel.classList.add('pixelated-image-card__pixel');
        pixel.style.width = `${pixelSize}%`; // Set the pixel width dynamically
        pixel.style.height = `${pixelSize}%`; // Set the pixel height dynamically
        pixel.style.left = `${col * pixelSize}%`; // Set the pixel's horizontal position
        pixel.style.top = `${row * pixelSize}%`; // Set the pixel's vertical position
        pixelGrid.appendChild(pixel);
      }
    }
    const pixels = pixelGrid.querySelectorAll('.pixelated-image-card__pixel');
    const totalPixels = pixels.length;
    const staggerDuration = animationStepDuration / totalPixels; // Calculate stagger duration dynamically
    let isActive = false; // Variable to track if the card is active
    let delayedCall;
    const animatePixels = (activate) => {
      isActive = activate;
      gsap.killTweensOf(pixels); // Reset any ongoing animations
      if (delayedCall) {
        delayedCall.kill();
      }
      gsap.set(pixels, { display: 'none' }); // Make all pixels invisible instantly
      // Show pixels randomly
      gsap.to(pixels, {
        display: 'block',
        duration: 0,
        stagger: {
          each: staggerDuration,
          from: 'random'
        }
      });
      // After animationStepDuration, show or hide the activeCard
      delayedCall = gsap.delayedCall(animationStepDuration, () => {
        if (activate) {
          activeCard.style.display = 'block';
          // **Set pointer-events to none so clicks pass through activeCard**
          activeCard.style.pointerEvents = 'none';
        } else {
          activeCard.style.display = 'none';
        }
      });
      // Hide pixels randomly
      gsap.to(pixels, {
        display: 'none',
        duration: 0,
        delay: animationStepDuration,
        stagger: {
          each: staggerDuration,
          from: 'random'
        }
      });
    };
    if (isTouchDevice) {
      // For touch devices, use click event
      card.addEventListener('click', () => {
        animatePixels(!isActive);
      });
    } else {
      // For non-touch devices, use mouseenter and mouseleave
      card.addEventListener('mouseenter', () => {
        if (!isActive) {
          animatePixels(true);
        }
      });
      card.addEventListener('mouseleave', () => {
        if (isActive) {
          animatePixels(false);
        }
      });
    }
  });
});

  
