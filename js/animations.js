// 1. Staggered entrance — phones fly up + fade in when scrolled into view
gsap.from(".draggable-phone", {
  scrollTrigger: {
    trigger: ".phones-arena",
    start: "top 80%",
    toggleActions: "play none none reverse"
  },
  y: 120,
  opacity: 0,
  duration: 1.2,
  ease: "power3.out",
  stagger: 0.15
});

// 2. Apply each phone's starting rotation from its data-rot attribute
document.querySelectorAll(".draggable-phone").forEach((phone) => {
  const rot = parseFloat(phone.dataset.rot || "0");
  gsap.set(phone, { rotation: rot });
});

// 3. Make every `.draggable-phone` click-and-drag, locked inside .phones-arena
Draggable.create(".draggable-phone", {
  type: "x,y",
  bounds: ".phones-arena",
  edgeResistance: 0.65,
  inertia: false,                 // free without the paid InertiaPlugin
  onPress() {
    // lift the dragged phone above the others
    gsap.to(this.target, { scale: 1.05, zIndex: 100, duration: 0.2 });
  },
  onRelease() {
    gsap.to(this.target, { scale: 1, duration: 0.2, delay: 0.1 });
  }
});

// 4. Rotate the ad images inside each screen (optional — remove if you use video)
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
