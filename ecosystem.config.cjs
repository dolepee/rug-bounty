module.exports = {
  apps: [
    {
      name: "rug-hunter",
      script: "agent/index.mjs",
      cwd: __dirname,
      interpreter: "node",
      env: {
        NODE_ENV: "production",
      },
      max_restarts: 10,
      restart_delay: 5000,
    },
  ],
};
