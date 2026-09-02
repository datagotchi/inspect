module.exports = {
  apps: [
    {
      name: "inspect",
      script: "yarn",
      args: "start",
      exec_mode: "cluster",
      instances: 1,
      interpreter: "/usr/bin/node",
    },
    {
      name: "fieldnotes", // A unique name for your application
      script: "./app.js", // Path to your main Node.js application file
      exec_mode: "cluster", // Execution mode, "cluster" for load balancing
      instances: 1, // Number of instances to run (e.g., "max" for all CPU cores)
      interpreter: "/usr/bin/node",
      watch: false, // Prevents unintended restarts on DB writes
    },
  ],
};
