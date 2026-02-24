import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        gitlab: {
          orange: "#FC6D26",
          purple: "#6B4FBB",
          dark: "#1F1E24",
        },
      },
    },
  },
  plugins: [],
};
export default config;
