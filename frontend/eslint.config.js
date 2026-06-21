import parser from "@typescript-eslint/parser";
import preferArrowFunctions from "eslint-plugin-prefer-arrow-functions";

export default [
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parser,
    },
    plugins: {
      "prefer-arrow-functions": preferArrowFunctions,
    },
    rules: {
      "prefer-arrow-functions/prefer-arrow-functions": "error",
    },
  },
];
