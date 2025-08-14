module.exports = {
  apps: [
    {
      name: "lunacycle-app",
      script: "./dist/server",
      // No interpreter is needed as this is a compiled binary.
    },
  ],
};
