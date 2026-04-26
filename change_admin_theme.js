const fs = require('fs');
const files = [
  'src/app/(admin)/layout.jsx',
  'src/app/(admin)/admin/dashboard/AdminDashboardClient.jsx',
  'src/components/layout/admin/ComingSoon.jsx',
  'src/components/layout/admin/AdminBottomNav.jsx',
  'src/components/layout/admin/AdminHeader.jsx',
  'src/components/layout/admin/AdminMobileDrawer.jsx',
  'src/components/layout/admin/AdminSidebar.jsx'
];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  
  // Backgrounds
  content = content.replace(/bg-neutral-950/g, 'bg-neutral-50/50');
  content = content.replace(/bg-neutral-900/g, 'bg-white shadow-sm');
  
  // Borders
  content = content.replace(/border-neutral-800/g, 'border-neutral-200');
  content = content.replace(/border-neutral-700/g, 'border-neutral-300');
  
  // Text colors (only when it's text-white and likely a heading/value, or text-neutral-400)
  // To avoid replacing text-white on colored badges (like bg-blue-500 text-white), we can just blindly replace them if they are common in dashboard cards.
  // Actually, wait. "text-white" might be used inside colored buttons or badges.
  // We can target specific patterns.
  content = content.replace(/text-white/g, 'text-neutral-900');
  
  // Wait! A badge like `bg-amber-500 text-white` will become `bg-amber-500 text-neutral-900` which is acceptable (dark text on amber).
  // What about `bg-danger text-white`? It becomes `bg-danger text-neutral-900`, which is a bit weird.
  // Let's restore text-white specifically on brand and danger buttons if any.
  // Actually, replacing `text-white` blindly is risky.
  // Let's just use `text-neutral-900` but restore `bg-brand text-neutral-900` back to `text-white` if needed.
  
  content = content.replace(/text-neutral-400/g, 'text-neutral-500');
  content = content.replace(/text-neutral-300/g, 'text-neutral-700');
  
  // The layout background
  content = content.replace(/bg-neutral-50\/50/g, 'bg-neutral-50/30');

  // Fix up any badges that we broke
  content = content.replace(/bg-brand text-neutral-900/g, 'bg-brand text-white');
  content = content.replace(/bg-danger text-neutral-900/g, 'bg-danger text-white');
  content = content.replace(/bg-emerald-500 text-neutral-900/g, 'bg-emerald-500 text-white');
  
  fs.writeFileSync(file, content);
}
console.log('Admin theme updated successfully!');
