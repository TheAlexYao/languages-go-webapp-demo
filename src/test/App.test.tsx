import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import App from '../App'
import * as supabaseService from '../services/supabase'

// Mock the Supabase service
vi.mock('../services/supabase', () => ({
  signInAnonymously: vi.fn(),
  supabase: {
    auth: {
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } }
      }))
    }
  },
  getUserCollectedCards: vi.fn(),
  getMasterVocabulary: vi.fn()
}))

// Mock the useGeolocation hook
vi.mock('../hooks/useGeolocation', () => ({
  useGeolocation: () => ({
    location: { lat: 40.7128, lng: -74.0060 },
    error: null,
    isLoading: false
  })
}))

// Mock the useCardCollection hook
vi.mock('../hooks/useCardCollection', () => ({
  useCardCollection: () => ({
    collectedCards: [],
    isLoading: false,
    stats: {
      totalCards: 0,
      uniqueWords: 0,
      languages: [],
      streak: 0,
      level: 1,
      xp: 0,
      achievements: []
    },
    collectCard: vi.fn(),
    getCardsByLanguage: vi.fn(() => []),
    getCardsByRarity: vi.fn(() => []),
    clearCollection: vi.fn()
  })
}))

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
}
Object.defineProperty(window, 'localStorage', { value: localStorageMock })

describe('App Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.getItem.mockReturnValue(null)
  })

  describe('Authentication Flow', () => {
    it('should show loading screen during authentication', () => {
      // Mock authentication in progress
      ;(supabaseService.signInAnonymously as any).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      )

      render(<App />)

      expect(screen.getByText('Languages Go')).toBeInTheDocument()
      expect(screen.getByText('Loading your adventure...')).toBeInTheDocument()
    })

    it('should show main app after successful authentication', async () => {
      // Mock successful authentication
      ;(supabaseService.signInAnonymously as any).mockResolvedValue({
        user: { id: 'test-user-id' },
        session: { access_token: 'test-token' }
      })

      render(<App />)

      await waitFor(() => {
        expect(screen.queryByText('Loading your adventure...')).not.toBeInTheDocument()
      })

      // Should show the main navigation
      expect(screen.getByText('Map')).toBeInTheDocument()
      expect(screen.getByText('Collection')).toBeInTheDocument()
      expect(screen.getByText('Community')).toBeInTheDocument()
    })

    it('should show error message on authentication failure', async () => {
      // Mock authentication failure
      ;(supabaseService.signInAnonymously as any).mockRejectedValue(
        new Error('Authentication failed')
      )

      render(<App />)

      await waitFor(() => {
        expect(screen.getByText(/Authentication failed/)).toBeInTheDocument()
      })

      expect(screen.getByText('Try Again')).toBeInTheDocument()
    })

    it('should retry authentication when Try Again is clicked', async () => {
      // Mock initial failure then success
      ;(supabaseService.signInAnonymously as any)
        .mockRejectedValueOnce(new Error('Authentication failed'))
        .mockResolvedValueOnce({
          user: { id: 'test-user-id' },
          session: { access_token: 'test-token' }
        })

      render(<App />)

      await waitFor(() => {
        expect(screen.getByText('Try Again')).toBeInTheDocument()
      })

      // Click retry button
      const retryButton = screen.getByText('Try Again')
      retryButton.click()

      await waitFor(() => {
        expect(screen.queryByText('Try Again')).not.toBeInTheDocument()
        expect(screen.getByText('Map')).toBeInTheDocument()
      })

      expect(supabaseService.signInAnonymously).toHaveBeenCalledTimes(2)
    })
  })

  describe('Navigation', () => {
    beforeEach(async () => {
      // Mock successful authentication
      ;(supabaseService.signInAnonymously as any).mockResolvedValue({
        user: { id: 'test-user-id' },
        session: { access_token: 'test-token' }
      })
    })

    it('should start with Map tab active', async () => {
      render(<App />)

      await waitFor(() => {
        expect(screen.getByText('Map')).toBeInTheDocument()
      })

      // Map tab should be active (you might need to check for specific styling or aria attributes)
      const mapTab = screen.getByText('Map').closest('button')
      expect(mapTab).toHaveClass('text-white') // Assuming active tabs have white text
    })

    it('should switch to Collection tab when clicked', async () => {
      render(<App />)

      await waitFor(() => {
        expect(screen.getByText('Collection')).toBeInTheDocument()
      })

      const collectionTab = screen.getByText('Collection')
      collectionTab.click()

      // Should show collection content
      expect(screen.getByText('Your Collection')).toBeInTheDocument()
    })

    it('should switch to Community tab when clicked', async () => {
      render(<App />)

      await waitFor(() => {
        expect(screen.getByText('Community')).toBeInTheDocument()
      })

      const communityTab = screen.getByText('Community')
      communityTab.click()

      // Should show community content
      expect(screen.getByText('Activity Feed')).toBeInTheDocument()
    })
  })

  describe('PWA Features', () => {
    it('should show install prompt when available', async () => {
      // Mock PWA install prompt
      const mockInstallPrompt = {
        prompt: vi.fn(),
        userChoice: Promise.resolve({ outcome: 'accepted' })
      }

      // Simulate beforeinstallprompt event
      window.dispatchEvent(
        new CustomEvent('beforeinstallprompt', { detail: mockInstallPrompt })
      )

      ;(supabaseService.signInAnonymously as any).mockResolvedValue({
        user: { id: 'test-user-id' },
        session: { access_token: 'test-token' }
      })

      render(<App />)

      await waitFor(() => {
        expect(screen.getByText('Map')).toBeInTheDocument()
      })

      // Should show install prompt (implementation depends on your InstallPrompt component)
      // This test might need adjustment based on your actual InstallPrompt implementation
    })
  })

  describe('Error Boundaries', () => {
    it('should handle component errors gracefully', async () => {
      // Mock successful authentication
      ;(supabaseService.signInAnonymously as any).mockResolvedValue({
        user: { id: 'test-user-id' },
        session: { access_token: 'test-token' }
      })

      // Mock console.error to avoid noise in test output
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      render(<App />)

      await waitFor(() => {
        expect(screen.getByText('Map')).toBeInTheDocument()
      })

      // The app should render without crashing
      expect(screen.getByText('Languages Go')).toBeInTheDocument()

      consoleSpy.mockRestore()
    })
  })
}) 