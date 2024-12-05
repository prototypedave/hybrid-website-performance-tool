/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: 'media',
  theme: {
    extend: {
      colors: {
        'navbar-bg': '#ffffff',
        'nav-text': '#333333',
        'nav-link': '##007bff',
        'nav-hover': '#0056b3',
        'nav-focus': '#80d8ff',
        'sidebar-bg': '#f8f9fa',
        'side-text': '#495057',
        'side-link': '#6c757d',
        'side-hover': '#343a40',
        'side-focus': '#adb5bd',
        'bg-main': "#F9FAFB",
        'bg-sub': '#FFFFFF',
        'btn-bg': '#2563EB',
        'hvr-bg': '#1D4ED8',
        'card': '#FFFFFF',
        'card-border': '#E5E7EB',
        'headings': '#1F2937',
        'subheadings': '#4B5563',
        'text': '#6B7280',
        'pure-green': '#008000',
        'org-yellow': '#FFAE42',
        'pure-red': '#FF0000',
        'lists': '#1F2937',
      
        'dark-navbar-bg': '#1e1e2f',
        'dark-nav-text': '#f8f9fa',
        'dark-nav-link': '#38bdf8',
        'dark-nav-hover': '#1d4ed8',
        'dark-nav-focus': '#60a5fa',
        'dark-sidebar-bg': '#121212',
        'dark-side-text': '#e5e7eb',
        'dark-side-link': '#9ca3af',
        'dark-side-hover': '#374151',
        'dark-side-focus': '#64748b',
        'dark-bg-main': '#111827',
        'dark-card': '#1F2937',
        'dark-card-border': '#374151',
        'dark-btn-bg': '#3B82F6',
        'dark-subheadings': '#9CA3AF',
        'dark-hvr-bg': '#3B3F45',
        'dark-headings': '#D1D5DB',
        'dark-lists': '#D1D5DB',
      },
      width: {
        'side': '12%',
        'main': '88%',
        'area': '55%', 
      },
      margin: {
        'side': '12%', 
      },
    },
    screens: {
      'sm': '640px',
      // => @media (min-width: 640px) { ... }

      'md': '868px',
      // => @media (min-width: 768px) { ... }

      'lg': '1024px',
      // => @media (min-width: 1024px) { ... }

      'xl': '1280px',
      // => @media (min-width: 1280px) { ... }

      '2xl': '1536px',
      // => @media (min-width: 1536px) { ... }
    }    
  },
  plugins: [],
}

