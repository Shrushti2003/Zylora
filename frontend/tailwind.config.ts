import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        ink: "#3F5D3A",
        ocean: "#556B2F",
        leaf: "#6F8A43",
        ember: "#C96A2B",
        "tertiary-container": "#E8D9C4",
        "outline-variant": "#CFC7B7",
        primary: "#556B2F",
        "on-tertiary": "#3F2B1D",
        "on-primary-fixed-variant": "#3F5D3A",
        "surface-container-high": "#EFE8D9",
        secondary: "#C96A2B",
        "on-secondary-container": "#6F3518",
        tertiary: "#8FA57A",
        "on-secondary-fixed-variant": "#8A421E",
        "on-primary": "#FAF8F2",
        "tertiary-fixed-dim": "#D7C9B5",
        "secondary-container": "#F4D9C7",
        "error-container": "#F6D1C9",
        "secondary-fixed-dim": "#E6AA7C",
        "surface-container-highest": "#E6DDCC",
        "secondary-fixed": "#F7CBAA",
        "primary-container": "#DDE7C7",
        "on-tertiary-fixed": "#2F4428",
        "surface-container-low": "#F7F3EA",
        "on-background": "#3F5D3A",
        "surface-container": "#F5F1E8",
        "on-error-container": "#7A1C13",
        "on-error": "#FFF7F2",
        "on-surface": "#3F5D3A",
        "on-secondary-fixed": "#3F2415",
        background: "#F7F3EA",
        "surface-variant": "#E9E1D0",
        "surface-container-lowest": "#FAF8F2",
        outline: "#938B79",
        surface: "#FAF8F2",
        "tertiary-fixed": "#EEF3E3",
        "inverse-surface": "#2F4428",
        "surface-tint": "#556B2F",
        "primary-fixed": "#E4ECCC",
        "surface-bright": "#FFFDF7",
        "on-primary-container": "#2F4428",
        "inverse-primary": "#C8D8AA",
        "on-surface-variant": "#6B715F",
        "on-secondary": "#FFF7F0",
        "on-tertiary-fixed-variant": "#3F5D3A",
        "primary-fixed-dim": "#C8D8AA",
        "on-primary-fixed": "#25361F",
        "inverse-on-surface": "#F7F3EA",
        "surface-dim": "#EDE5D6",
        "on-tertiary-container": "#365231",
        error: "#B42318"
      },
      borderRadius: {
        DEFAULT: "0.25rem",
        lg: "0.5rem",
        xl: "0.75rem",
        full: "9999px"
      },
      spacing: {
        xs: "4px",
        sm: "12px",
        base: "8px",
        md: "24px",
        lg: "48px",
        xl: "80px",
        gutter: "24px",
        "margin-desktop": "64px",
        "margin-mobile": "16px"
      },
      fontFamily: {
        "body-lg": ["Inter", "ui-sans-serif", "system-ui"],
        "display-lg": ["Manrope", "Inter", "ui-sans-serif", "system-ui"],
        "headline-md": ["Manrope", "Inter", "ui-sans-serif", "system-ui"],
        "body-md": ["Inter", "ui-sans-serif", "system-ui"],
        "label-sm": ["JetBrains Mono", "ui-monospace", "SFMono-Regular", "monospace"]
      },
      fontSize: {
        "body-lg": ["18px", { lineHeight: "28px", fontWeight: "400" }],
        "display-lg": ["48px", { lineHeight: "56px", fontWeight: "700" }],
        "headline-md": ["24px", { lineHeight: "32px", fontWeight: "600" }],
        "body-md": ["16px", { lineHeight: "24px", fontWeight: "400" }],
        "label-sm": ["12px", { lineHeight: "16px", fontWeight: "500" }]
      },
      boxShadow: {
        surface: "0 22px 60px -38px rgba(47, 68, 40, 0.34)"
      }
    }
  },
  plugins: []
} satisfies Config;
