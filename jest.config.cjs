module.exports = {
  testEnvironment: "node",
  testMatch: ["**/test/**/*.test.js", "**/scripts/**/*.test.js"],
  clearMocks: true,
  coveragePathIgnorePatterns: ["/node_modules/"],
};
