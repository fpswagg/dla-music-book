// pm2 start worker/ecosystem.config.cjs   (from the repo root)
module.exports = {
  apps: [
    {
      name: "myenge-worker",
      cwd: __dirname + "/..",
      script: "worker/index.ts",
      interpreter: "node",
      node_args: "--env-file=.env --conditions=react-server --import tsx",
      env: { NODE_ENV: "production" },
      max_memory_restart: "400M",
      kill_timeout: 30000,
    },
  ],
};
