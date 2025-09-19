import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./client/index.html", "./client/src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },        
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        chart: {
          "1": "hsl(var(--chart-1))",
          "2": "hsl(var(--chart-2))",
          "3": "hsl(var(--chart-3))",
          "4": "hsl(var(--chart-4))",
          "5": "hsl(var(--chart-5))",
        },
        principal: "hsl(var(--principal))",
        "header-background": "hsl(var(--header-background))",
        light: 'hsl(var(--light))',
        buttonHover: 'hsl(var(--button-hover))',

        // Sidebar colors
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
          hover: "hsl(var(--sidebar-hover))",
          system: 'hsl(var(--sidebar-system))',
          gestion: 'hsl(var(--sidebar-gestion))',
          operations: 'hsl(var(--sidebar-operations))',
          adminFinance: 'hsl(var(--sidebar-admin-finance))',
          mktComm: 'hsl(var(--sidebar-mkt-comm))',
          hr: 'hsl(var(--sidebar-hr))',
          security: 'hsl(var(--sidebar-security))',
          public: 'hsl(var(--sidebar-public))',
        },

        // Niveles en charts
        value: {
          high: 'hsl(var(--high))',
          medium: 'hsl(var(--medium))',
          low: 'hsl(var(--low))',
        },

        // Estados del sistema
        status: {
          active: 'hsl(var(--status-active))',
          scheduled: 'hsl(var(--status-scheduled))',
          cancelled: 'hsl(var(--status-cancelled))',
          paused: 'hsl(var(--status-paused))',
          awaitingBudget: 'hsl(var(--status-awaiting-budget))',
          foreground: 'hsl(var(--status-foreground))',
        },

        // Categorías temáticas
        category: {
          art: 'hsl(var(--category-art))',
          nature: 'hsl(var(--category-nature))',
          recreation: 'hsl(var(--category-recreation))',
          community: 'hsl(var(--category-community))',
          foreground: 'hsl(var(--category-foreground))',
        },
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
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
} satisfies Config;
