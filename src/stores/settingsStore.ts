import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface SettingsState {
  language: 'th' | 'en'
  setLanguage: (lang: 'th' | 'en') => void
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      language: 'th',
      setLanguage: (language) => set({ language }),
      sidebarOpen: true,
      setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
    }),
    { name: 'pos-settings' }
  )
)
