// FILE: src/components/AntiFlash.jsx
// Inject as the FIRST child of <head> in layout.jsx.
// Reads the persisted Zustand theme preference from localStorage
// and applies/removes the 'dark' class BEFORE the first paint —
// eliminating the white flash on page load in dark mode.
//
// Usage in src/app/layout.jsx:
//   import AntiFlash from '@/components/AntiFlash'
//   ...
//   <html suppressHydrationWarning ...>
//     <head>
//       <AntiFlash />        ← first child, before everything else
//     </head>
//     <body>...</body>
//   </html>

export default function AntiFlash() {
  // This script runs synchronously before CSS paints.
  // It must be a raw string — no imports, no React, no JSX.
  const script = `
(function(){
  try {
    var stored = localStorage.getItem('novara-theme');
    var pref   = stored ? JSON.parse(stored).state?.preference : null;
    var isDark = pref === 'dark'
      || (pref !== 'light' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    if (isDark) {
      document.documentElement.classList.add('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.setAttribute('data-theme', 'light');
    }
  } catch(e) {}
})();
  `.trim()

  return (
    <script
      dangerouslySetInnerHTML={{ __html: script }}
    />
  )
}