import { create } from 'zustand'
import type { User } from '../api/types'

interface AuthState {
  token: string | null
  user: User | null
  setToken: (token: string) => void
  setUser: (user: User) => void
  logout: () => void
  isTrainer: () => boolean
  isAdmin: () => boolean
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: localStorage.getItem('token'),
  user: null,

  setToken: (token) => {
    localStorage.setItem('token', token)
    set({ token })
  },

  setUser: (user) => set({ user }),

  logout: () => {
    localStorage.removeItem('token')
    set({ token: null, user: null })
  },

  isTrainer: () => {
    const rolle = get().user?.rolle
    return rolle === 'trainer' || rolle === 'admin'
  },

  isAdmin: () => get().user?.rolle === 'admin',
}))
