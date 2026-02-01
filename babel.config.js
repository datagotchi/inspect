const presets = [
  ["@babel/preset-env", { targets: { node: "current" } }],
  ["@babel/preset-react", { targets: { node: "current" } }],
  ["@babel/preset-typescript"],
];
const sourceMaps = true;

export { presets, sourceMaps };
