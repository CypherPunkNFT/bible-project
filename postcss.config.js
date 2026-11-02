import autoprefixer from "autoprefixer";
import tailwindcss from "tailwindcss";
import logicalCss from "./scripts/logical-css.js";

export default {
  plugins: [tailwindcss(), autoprefixer(), logicalCss()],
};
