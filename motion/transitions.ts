export const screenEnter = {
  from: { autoAlpha: 0, y: 12 },
  to: { autoAlpha: 1, y: 0, duration: 0.34, ease: "power2.out" }
} as const;

export const cardStagger = {
  from: { autoAlpha: 0, y: 16 },
  to: { autoAlpha: 1, y: 0, duration: 0.34, ease: "power2.out" },
  stagger: 0.05
} as const;
