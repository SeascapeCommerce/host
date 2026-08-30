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


/* D0: Background video subtle motion */
gsap.to(".bg-video", {
  scrollTrigger: {
    trigger: "#services",
    start: "top bottom",
    scrub: true
  },
  scale: 1.08,
  filter: "blur(1px)"
});

/* D1: Grain drift */
gsap.to(".scene-grain", {
  scrollTrigger: {
    trigger: "#services",
    start: "top bottom",
    scrub: true
  },
  y: -200
});

/* D2: Reactive bloom light */
gsap.to(".scene-light", {
  scrollTrigger: {
    trigger: "#services",
    start: "top 80%",
    end: "bottom 20%",
    scrub: true
  },
  opacity: 0.35,
  backgroundPosition: "50% 40%"
});

/* D3: Foreground entrance */
gsap.to(".scene-inner", {
  scrollTrigger: {
    trigger: "#services",
    start: "top 85%",
  },
  y: 0,
  opacity: 1,
  duration: 1.6,
  ease: "power3.out"
});

/* D4: Directional reel motion */
gsap.to(".directional-reel .frame", {
  scrollTrigger: {
    trigger: ".services-grid",
    start: "top 80%",
  },
  opacity: 1,
  x: 0,
  y: 0,
  duration: 1.4,
  ease: "power3.out",
  stagger: 0.18
});

/* Frame-cut slicing */
gsap.to(".frame-cut", {
  scrollTrigger: {
    trigger: ".frame-cut",
    start: "top 90%",
  },
  borderColor: "rgba(255,255,255,0.45)",
  duration: 1.2,
  ease: "power2.out"
});

/* Magnetic hover physics */
document.querySelectorAll(".service-card").forEach(card => {
  card.addEventListener("mousemove", e => {
    const rect = card.getBoundingClientRect();
    const x = (e.clientX - rect.left - rect.width/2) / 20;
    const y = (e.clientY - rect.top - rect.height/2) / 20;
    gsap.to(card, { x, y, duration: 0.3 });
  });
  card.addEventListener("mouseleave", () => {
    gsap.to(card, { x: 0, y: 0, duration: 0.4 });
  });
});


  // ─── Image Animation Scroll PAUSE ON HOVER ───
const showcaseTL = gsap.timeline({

  scrollTrigger:{
    trigger:"#platform-showcase",
    start:"top 70%",
    once:true
  }

});

showcaseTL

.to(".card1 .image-mask",{
  scaleX:0,
  duration:1
})

.to(".card1",{
  opacity:1,
  y:0,
  scale:1,
  duration:.8
},"<")

.to(".card2 .image-mask",{
  scaleX:0,
  duration:1
},"-=0.5")

.to(".card2",{
  opacity:1,
  y:0,
  scale:1,
  duration:.8
},"<")

.to(".card3 .image-mask",{
  scaleX:0,
  duration:1
},"-=0.5")

.to(".card3",{
  opacity:1,
  y:0,
  scale:1,
  duration:.8
},"<")

.to(".card4 .image-mask",{
  scaleX:0,
  duration:1
},"-=0.5")

.to(".card4",{
  opacity:1,
  y:0,
  scale:1,
  duration:.8
},"<")

.from(".showcase-cta",{
  opacity:0,
  y:30,
  duration:.7
},"-=0.2");




gsap.to(".box", {
  duration: 1,
  rotation: 360,
  opacity: 1,
  delay: 0.5,
  stagger: 0.1, // stagger in from the left with a 0.1 second gap in between animations
  ease: "sine.out"
});

document.querySelectorAll(".box").forEach((box, index) => {
  box.addEventListener("click", () => {
    gsap.to(".box", {
      duration: 0.5,
      opacity: 0,
      y: -100,
      stagger: {
        from: index, // stagger in from the clicked element's index
        amount: 1 // spread the entire stagger out over 1 second
      },
      ease: "back.in",
      overwrite: "auto"
    });
  });
});
