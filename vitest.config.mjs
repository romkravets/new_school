// jsdom створюється явно в tests/helpers/load-script.js
export default {
  test: { environment: "node", include: ["tests/**/*.test.js"] }
};
