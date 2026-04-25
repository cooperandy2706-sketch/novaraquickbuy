// FILE: src/store/uiStore.js
'use client'

import { create }  from 'zustand'
import { persist } from 'zustand/middleware'

export const useUiStore = create(
  persist(
    (set) => ({
      productModalOpen:  false,
      selectedProduct:   null,
      openProductModal:  (product) => set({ productModalOpen: true,  selectedProduct: product }),
      closeProductModal: ()        => set({ productModalOpen: false, selectedProduct: null   }),

      authModalOpen:     false,
      authModalMessage:  '',
      openAuthModal:     (msg = 'Sign in to continue') => set({ authModalOpen: true, authModalMessage: msg }),
      closeAuthModal:    () => set({ authModalOpen: false, authModalMessage: '' }),

      sidebarCollapsed:            false,
      toggleSidebar:               () => set(s => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setSidebarCollapsed:         (v) => set({ sidebarCollapsed: v }),

      customerSidebarCollapsed:    false,
      toggleCustomerSidebar:       () => set(s => ({ customerSidebarCollapsed: !s.customerSidebarCollapsed })),
      setCustomerSidebarCollapsed: (v) => set({ customerSidebarCollapsed: v }),

      drawerOpen:      false,
      openDrawer:      () => set({ drawerOpen: true  }),
      closeDrawer:     () => set({ drawerOpen: false }),

      searchOpen:      false,
      openSearch:      () => set({ searchOpen: true  }),
      closeSearch:     () => set({ searchOpen: false }),

      cartDrawerOpen:  false,
      openCartDrawer:  () => set({ cartDrawerOpen: true  }),
      closeCartDrawer: () => set({ cartDrawerOpen: false }),

      statusViewerOpen:     false,
      statusUploaderOpen:   false,
      activeStatusVendorId: null,
      openStatusViewer:     (vendorId = null) => set({ statusViewerOpen: true, activeStatusVendorId: vendorId }),
      closeStatusViewer:    ()                => set({ statusViewerOpen: false, activeStatusVendorId: null }),
      openStatusUploader:   ()                => set({ statusUploaderOpen: true }),
      closeStatusUploader:  ()                => set({ statusUploaderOpen: false }),
    }),
    {
      name: 'novara-ui',
      partialize: (s) => ({
        sidebarCollapsed:         s.sidebarCollapsed,
        customerSidebarCollapsed: s.customerSidebarCollapsed,
      }),
    }
  )
)