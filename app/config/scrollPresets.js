export const scrollPresets = {
  default: { lerp: 0.1 },
  heavy: { lerp: 0.05 },
  expo: {
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  },
};
