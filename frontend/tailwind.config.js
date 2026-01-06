/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ["class"],
    content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
  	extend: {
  		// ============================================
  		// ZOECHELFYN BRAND COLORS - THE SCREENING ROOM
  		// Edit these hex values to adjust brand colors
  		// ============================================
  		colors: {
  			// Primary Brand Colors
  			brand: {
  				orange: {
  					DEFAULT: '#F5A623',  // Primary orange
  					light: '#FFB84D',    // Lighter orange for hovers
  					dark: '#D4891A',     // Darker orange for active states
  				},
  				purple: {
  					DEFAULT: '#7B4BA0',  // Primary purple/accent
  					light: '#9B6BC0',    // Lighter purple for hovers
  					dark: '#5C3580',     // Darker purple for active states
  				},
  			},
  			// Background Colors
  			surface: {
  				DEFAULT: '#0A0A0B',      // Main app background (deep charcoal/black)
  				elevated: '#111113',     // Slightly elevated surfaces (sidebars)
  				overlay: '#1A1A1C',      // Modal/dropdown backgrounds
  				hover: '#1F1F22',        // Hover state backgrounds
  			},
  			// Text Colors
  			content: {
  				DEFAULT: '#F5F5F5',      // Primary text (off-white)
  				secondary: '#A0A0A5',    // Secondary text (grey)
  				muted: '#6B6B70',        // Muted/disabled text
  				inverse: '#0A0A0B',      // Dark text on light backgrounds
  			},
  			// Semantic Colors
  			status: {
  				success: '#34D399',      // Green for resolved/success
  				warning: '#FBBF24',      // Amber for warnings/open
  				error: '#F87171',        // Red for errors
  				info: '#60A5FA',         // Blue for info
  			},
  			// UI Component Colors (mapped to brand)
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			}
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		keyframes: {
  			'accordion-down': {
  				from: {
  					height: '0'
  				},
  				to: {
  					height: 'var(--radix-accordion-content-height)'
  				}
  			},
  			'accordion-up': {
  				from: {
  					height: 'var(--radix-accordion-content-height)'
  				},
  				to: {
  					height: '0'
  				}
  			}
  		},
  		animation: {
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out'
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
};
