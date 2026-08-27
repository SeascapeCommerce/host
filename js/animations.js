// Phone wrapper slides up into view
gsap.from(".phone-wrapper", {
  scrollTrigger: {
    trigger: ".phone-section",
    start: "top 80%",
    toggleActions: "play none none reverse"
  },
  y: 80,
  opacity: 0,
  duration: 1.4,
  ease: "power3.out"
});

// Screen content fades + scales in
gsap.from(".phone-screen", {
  scrollTrigger: {
    trigger: ".phone-section",
    start: "top 75%"
  },
  scale: 0.9,
  opacity: 0,
  duration: 1.2,
  ease: "power2.out"
});

// Menu items stagger in
gsap.from(".menu li", {
  scrollTrigger: {
    trigger: ".phone-section",
    start: "top 75%"
  },
  y: 20,
  opacity: 0,
  duration: 0.8,
  ease: "power2.out",
  stagger: 0.12
});

// Text block reveal
gsap.from(".text-block > *", {
  scrollTrigger: {
    trigger: ".text-block",
    start: "top 85%"
  },
  y: 30,
  opacity: 0,
  duration: 1,
  ease: "power2.out",
  stagger: 0.15
});

// Rotating ad images inside the phone screen
const ads = [
  "Screenshot2.png",
  "Screenshot1.png",
  "Screenshot3.png",
  "Screenshot4.png"
];

let index = 0;
setInterval(() => {
  index = (index + 1) % ads.length;
  gsap.to(".ad-image", {
    opacity: 0,
    duration: 0.4,
    onComplete: () => {
      const img = document.querySelector(".ad-image");
      if (img) img.src = ads[index];
      gsap.to(".ad-image", { opacity: 1, duration: 0.4 });
    }
  });
}, 3500);
