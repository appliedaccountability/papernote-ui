import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import typescript from "@rollup/plugin-typescript";
import peerDepsExternal from "rollup-plugin-peer-deps-external";
import postcss from "rollup-plugin-postcss";
import dts from "rollup-plugin-dts";

export default [
  {
    input: "src/components/index.ts",
    output: [
      {
        file: "dist/index.js",
        format: "cjs",
        sourcemap: true,
      },
      {
        file: "dist/index.esm.js",
        format: "esm",
        sourcemap: true,
      },
    ],
    plugins: [
      peerDepsExternal(),
      resolve(),
      commonjs(),
      typescript({
        tsconfig: "./tsconfig.json",
        declaration: true,
        declarationDir: "dist",
      }),
      postcss({
        extensions: [".css"],
        minimize: true,
        inject: false,
        extract: "styles.css",
      }),
    ],
    external: [
      "react",
      "react-dom",
      "react-router-dom",
      "lucide-react",
      "@tanstack/react-virtual",
    ],
  },
  {
    input: "src/styles/index.css",
    output: {
      file: "dist/styles.css",
    },
    plugins: [
      postcss({
        extensions: [".css"],
        minimize: false,
        extract: true,
        config: {
          path: "./postcss.config.cjs",
        },
      }),
    ],
  },
  {
    input: "dist/components/index.d.ts",
    output: [{ file: "dist/index.d.ts", format: "esm" }],
    plugins: [dts()],
    external: [/\.css$/], // Ignore CSS imports in type definitions
  },
];
