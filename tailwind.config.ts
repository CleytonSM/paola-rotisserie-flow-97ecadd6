import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        // Tipografia: "Satoshi" (corpo) + "Cormorant Garamond" (títulos)
        sans: ['Satoshi', 'system-ui', 'sans-serif'],
        display: ['Cormorant Garamond', 'serif'],
      },
      colors: {
        // Paleta de Cores: Quente, Clássica, Acolhedora
        border: "hsl(var(--border))", // #F0E6D2
        input: "hsl(var(--input))", // #F8F4F0 (filled style)
        ring: "hsl(var(--ring))", // #FFB300

        background: "hsl(var(--background))", // #FFFBF5 (creme claro)
        foreground: "hsl(var(--foreground))", // #2E2E2E (quase preto)

        primary: {
          DEFAULT: "hsl(var(--primary))", // #FFB300 (amarelo-dourado)
          foreground: "hsl(var(--primary-foreground))", // #1F2937 (texto escuro para CTAs)
          hover: "hsl(var(--primary-hover))", // #E6A100 (amarelo mais escuro)
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))", // #5DAB57 (verde-oliva)
          foreground: "hsl(var(--secondary-foreground))", // #FFFEFB (texto claro)
          hover: "hsl(var(--secondary-hover))", // #559C4F (verde mais escuro)
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))", // Mantido (vermelho)
          foreground: "hsl(var(--destructive-foreground))",
        },
        /* Azul Escuro */
        tertiary: {
          DEFAULT: "hsl(var(--tertiary))", // #000080 (azul escuro)
          foreground: "hsl(var(--tertiary-foreground))", // #FFFFFF (texto claro)
          hover: "hsl(var(--tertiary-hover))", // #000080 (azul escuro)
        },
        muted: {
          DEFAULT: "hsl(var(--muted))", // #F8F4F0 (fundo de input)
          foreground: "hsl(var(--muted-foreground))", // #6B7280 (texto secundário)
        },
        accent: {
          DEFAULT: "hsl(var(--accent))", // #F8F4F0 (hover sutil)
          foreground: "hsl(var(--accent-foreground))", // #2E2E2E
        },
        popover: {
          DEFAULT: "hsl(var(--popover))", // #FFFEFB (fundo de card)
          foreground: "hsl(var(--popover-foreground))", // #2E2E2E
        },
        card: {
          DEFAULT: "hsl(var(--card))", // #FFFEFB (fundo de card)
          foreground: "hsl(var(--card-foreground))", // #2E2E2E
        },
      },
      borderRadius: {
        // Cantos mais arredondados
        lg: "var(--radius)",
        md: "calc(var(--radius) - 4px)",
        sm: "calc(var(--radius) - 8px)",
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;