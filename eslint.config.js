import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

// The CypherPunk NFT site's rules: zero warnings, exhaustive-deps is an error, and no raw-HTML path
// into the DOM — every word of Scripture renders as a React text node.
export default tseslint.config(
  // Raw source downloads are documented in content/questions/sources/README.md; profile-bridge.js is the bundled output of design/scholar-periods/build.mjs.
  { ignores: ["content/questions/sources/raw/**", "design/scholar-periods/profile-bridge.js", "dist", "coverage", "playwright-report", "test-results", "e2e/.output", "public", "src/generated", ".wrangler", ".local", ".release", "worker-configuration.d.ts"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2022,
      globals: { ...globals.browser, ...globals.node },
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-hooks/exhaustive-deps": "error",
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      "no-restricted-syntax": [
        "error",
        {
          selector: "JSXAttribute[name.name='dangerouslySetInnerHTML']",
          message: "dangerouslySetInnerHTML is banned.",
        },
        {
          selector: "AssignmentExpression[left.property.name='innerHTML']",
          message: "innerHTML is banned.",
        },
      ],
    },
  },
);
