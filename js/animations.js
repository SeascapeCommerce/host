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

// ============================================================
//  Text Scrolling Animation - SplitText
//  Works with GSAP and SplitText plugins
// ============================================================

// Wait for everything to load including GSAP plugins
window.addEventListener('load', function() {
    'use strict';

    // Check if GSAP and SplitText are available
    if (typeof gsap === 'undefined') {
        console.error('GSAP not loaded!');
        return;
    }

    if (typeof SplitText === 'undefined') {
        console.error('SplitText plugin not loaded!');
        return;
    }

    // Register SplitText plugin
    gsap.registerPlugin(SplitText);

    // DOM Elements
    const textElement = document.querySelector('.text');
    const charsBtn = document.querySelector('#chars');
    const wordsBtn = document.querySelector('#words');
    const linesBtn = document.querySelector('#lines');
    
    if (!textElement) {
        console.error('Text element not found!');
        return;
    }

    let split = null;
    let animation = null;
    let isAnimating = false;

    // ===== Setup SplitText =====
    function setupSplitText() {
        try {
            // Clean up existing split
            if (split) {
                split.revert();
                split = null;
            }
            
            // Kill any ongoing animation
            if (animation) {
                animation.kill();
                animation = null;
            }

            // Create new split
            split = new SplitText(textElement, {
                type: 'chars,words,lines'
            });

            // Reset all elements to visible
            if (split.chars && split.chars.length) {
                gsap.set(split.chars, { 
                    opacity: 1,
                    x: 0,
                    y: 0,
                    rotation: 0,
                    rotationX: 0
                });
            }
            if (split.words && split.words.length) {
                gsap.set(split.words, { 
                    opacity: 1,
                    x: 0,
                    y: 0,
                    rotation: 0
                });
            }
            if (split.lines && split.lines.length) {
                gsap.set(split.lines, { 
                    opacity: 1,
                    rotationX: 0
                });
            }

            // Update button states
            updateButtonStates('chars');
            
            console.log('SplitText setup complete!');
        } catch (error) {
            console.error('Error setting up SplitText:', error);
        }
    }

    // ===== Update Active Button =====
    function updateButtonStates(activeId) {
        [charsBtn, wordsBtn, linesBtn].forEach(btn => {
            btn.classList.remove('active');
        });
        const activeBtn = document.querySelector(`#${activeId}`);
        if (activeBtn) {
            activeBtn.classList.add('active');
        }
    }

    // ===== Animation Functions =====
    function animateChars() {
        if (isAnimating || !split || !split.chars) return;
        isAnimating = true;

        if (animation) {
            animation.kill();
            animation = null;
        }

        updateButtonStates('chars');

        gsap.set(split.chars, { 
            opacity: 1,
            x: 0
        });

        animation = gsap.from(split.chars, {
            x: 150,
            opacity: 0,
            duration: 0.7,
            ease: 'power4.out',
            stagger: {
                each: 0.04,
                from: 'random'
            },
            onComplete: () => {
                gsap.set(split.chars, { opacity: 1, x: 0 });
                isAnimating = false;
            },
            onStart: () => {
                gsap.set(split.chars, { opacity: 0, x: 150 });
            }
        });
    }

    function animateWords() {
        if (isAnimating || !split || !split.words) return;
        isAnimating = true;

        if (animation) {
            animation.kill();
            animation = null;
        }

        updateButtonStates('words');

        gsap.set(split.words, { 
            opacity: 1,
            y: 0,
            rotation: 0
        });

        animation = gsap.from(split.words, {
            y: -120,
            opacity: 0,
            rotation: 'random(-80, 80)',
            duration: 0.8,
            ease: 'back.out(1.7)',
            stagger: {
                each: 0.15,
                from: 'random'
            },
            onComplete: () => {
                gsap.set(split.words, { opacity: 1, y: 0, rotation: 0 });
                isAnimating = false;
            },
            onStart: () => {
                gsap.set(split.words, { opacity: 0, y: -120 });
            }
        });
    }

    function animateLines() {
        if (isAnimating || !split || !split.lines) return;
        isAnimating = true;

        if (animation) {
            animation.kill();
            animation = null;
        }

        updateButtonStates('lines');

        gsap.set(split.lines, { 
            opacity: 1,
            rotationX: 0
        });

        animation = gsap.from(split.lines, {
            rotationX: -120,
            transformOrigin: '50% 50% -200px',
            opacity: 0,
            duration: 0.9,
            ease: 'power3.out',
            stagger: {
                each: 0.25,
                from: 'start'
            },
            onComplete: () => {
                gsap.set(split.lines, { opacity: 1, rotationX: 0 });
                isAnimating = false;
            },
            onStart: () => {
                gsap.set(split.lines, { opacity: 0, rotationX: -120 });
            }
        });
    }

    // ===== Event Listeners =====
    charsBtn.addEventListener('click', function(e) {
        e.preventDefault();
        animateChars();
    });
    
    wordsBtn.addEventListener('click', function(e) {
        e.preventDefault();
        animateWords();
    });
    
    linesBtn.addEventListener('click', function(e) {
        e.preventDefault();
        animateLines();
    });

    // ===== Handle Window Resize =====
    let resizeTimeout;
    window.addEventListener('resize', function() {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(function() {
            let activeId = 'chars';
            if (wordsBtn.classList.contains('active')) activeId = 'words';
            if (linesBtn.classList.contains('active')) activeId = 'lines';
            
            setupSplitText();
            
            setTimeout(function() {
                if (activeId === 'chars') animateChars();
                else if (activeId === 'words') animateWords();
                else if (activeId === 'lines') animateLines();
            }, 100);
        }, 300);
    });

    // ===== Initialize =====
    setupSplitText();

    // Auto-play character animation on load
    setTimeout(function() {
        animateChars();
    }, 500);

    console.log('Animation initialized successfully!');

}); // end window load

