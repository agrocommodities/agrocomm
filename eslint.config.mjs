import { FlatCompat } from "@eslint/eslintrc";
 
const compat = new FlatCompat({
  baseDirectory: import.meta.dirname
});
 
const eslintConfig = [
  ...compat.config({
    extends: ["next"],
    rules: {
      "react/no-unescaped-entities": "off",
      "@next/next/no-page-custom-font": "off",
      "@typescript-eslint/no-unused-vars": "off"
    },
  }),
];

export default eslintConfig;