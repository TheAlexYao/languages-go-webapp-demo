import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useCardCollection } from '../hooks/useCardCollection'
import * as supabaseService from '../services/supabase'
import type { VocabularyCard } from '../types/vocabulary'

// Mock the Supabase service
vi.mock('../services/supabase', () => ({
  getUserCollectedCards: vi.fn(),
  collectCard: vi.fn()
}))

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
}
Object.defineProperty(window, 'localStorage', { value: localStorageMock })

describe('useCardCollection Hook', () => {
  const mockCard: VocabularyCard = {
    id: '1',
    word: 'tree',
    translation: 'árbol',
    language: 'en',
    difficulty: 1,
    aiImageUrl: 'https://example.com/tree.jpg',
    aiPrompt: '',
    pinId: 'pin-1',
    rarity: 'common',
    category: 'nature'
  }

  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.getItem.mockReturnValue(null)
  })

  describe('Initial Loading', () => {
    it('should start with loading state', () => {
      ;(supabaseService.getUserCollectedCards as any).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      )

      const { result } = renderHook(() => useCardCollection())

      expect(result.current.isLoading).toBe(true)
      expect(result.current.collectedCards).toEqual([])
    })

    it('should load collected cards from Supabase successfully', async () => {
      ;(supabaseService.getUserCollectedCards as any).mockResolvedValue([mockCard])

      const { result } = renderHook(() => useCardCollection())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.collectedCards).toEqual([mockCard])
      expect(result.current.stats.totalCards).toBe(1)
      expect(result.current.stats.uniqueWords).toBe(1)
      expect(result.current.stats.languages).toEqual(['en'])
    })

    it('should handle Supabase loading errors gracefully', async () => {
      ;(supabaseService.getUserCollectedCards as any).mockRejectedValue(
        new Error('Network error')
      )

      const { result } = renderHook(() => useCardCollection())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.collectedCards).toEqual([])
      expect(result.current.stats.totalCards).toBe(0)
    })

    it('should load and merge stats from localStorage', async () => {
      const savedStats = {
        totalCards: 0,
        uniqueWords: 0,
        languages: [],
        streak: 5,
        level: 2,
        xp: 150,
        achievements: [{ id: 'first-card', name: 'First Card', description: 'Test', icon: '🎉' }]
      }

      localStorageMock.getItem.mockReturnValue(JSON.stringify(savedStats))
      ;(supabaseService.getUserCollectedCards as any).mockResolvedValue([])

      const { result } = renderHook(() => useCardCollection())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.stats.streak).toBe(5)
      expect(result.current.stats.achievements).toHaveLength(1)
    })
  })

  describe('Card Collection', () => {
    it('should collect a card successfully', async () => {
      ;(supabaseService.getUserCollectedCards as any).mockResolvedValue([])
      ;(supabaseService.collectCard as any).mockResolvedValue(undefined)

      const { result } = renderHook(() => useCardCollection())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await act(async () => {
        await result.current.collectCard(mockCard)
      })

      expect(supabaseService.collectCard).toHaveBeenCalledWith(mockCard)
      expect(result.current.collectedCards).toHaveLength(1)
      expect(result.current.collectedCards[0].word).toBe('tree')
      expect(result.current.collectedCards[0].collectedAt).toBeInstanceOf(Date)
    })

    it('should handle card collection errors', async () => {
      ;(supabaseService.getUserCollectedCards as any).mockResolvedValue([])
      ;(supabaseService.collectCard as any).mockRejectedValue(new Error('Collection failed'))

      const { result } = renderHook(() => useCardCollection())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await expect(
        act(async () => {
          await result.current.collectCard(mockCard)
        })
      ).rejects.toThrow('Collection failed')

      expect(result.current.collectedCards).toHaveLength(0)
    })

    it('should update stats when collecting cards', async () => {
      ;(supabaseService.getUserCollectedCards as any).mockResolvedValue([])
      ;(supabaseService.collectCard as any).mockResolvedValue(undefined)

      const { result } = renderHook(() => useCardCollection())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.stats.totalCards).toBe(0)
      expect(result.current.stats.xp).toBe(0)

      await act(async () => {
        await result.current.collectCard(mockCard)
      })

      expect(result.current.stats.totalCards).toBe(1)
      expect(result.current.stats.xp).toBe(10) // difficulty 1 * 10
      expect(result.current.stats.uniqueWords).toBe(1)
      expect(result.current.stats.languages).toEqual(['en'])
    })

    it('should calculate XP correctly based on difficulty and rarity', async () => {
      ;(supabaseService.getUserCollectedCards as any).mockResolvedValue([])
      ;(supabaseService.collectCard as any).mockResolvedValue(undefined)

      const rareCard: VocabularyCard = {
        ...mockCard,
        id: '2',
        word: 'mountain',
        difficulty: 3,
        rarity: 'rare'
      }

      const { result } = renderHook(() => useCardCollection())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await act(async () => {
        await result.current.collectCard(rareCard)
      })

      // difficulty 3 * 10 + rare bonus 20 = 50 XP
      expect(result.current.stats.xp).toBe(50)
    })

    it('should trigger achievements when collecting cards', async () => {
      ;(supabaseService.getUserCollectedCards as any).mockResolvedValue([])
      ;(supabaseService.collectCard as any).mockResolvedValue(undefined)

      const { result } = renderHook(() => useCardCollection())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.stats.achievements).toHaveLength(0)

      await act(async () => {
        await result.current.collectCard(mockCard)
      })

      // Should unlock "First Discovery" achievement
      const firstCardAchievement = result.current.stats.achievements.find(
        a => a.id === 'first-card'
      )
      expect(firstCardAchievement).toBeDefined()
      expect(firstCardAchievement?.unlockedAt).toBeInstanceOf(Date)
    })
  })

  describe('Utility Functions', () => {
    beforeEach(async () => {
      const cards = [
        mockCard,
        { ...mockCard, id: '2', word: 'casa', language: 'es', rarity: 'rare' as const },
        { ...mockCard, id: '3', word: 'house', language: 'en', rarity: 'epic' as const }
      ]
      ;(supabaseService.getUserCollectedCards as any).mockResolvedValue(cards)
    })

    it('should filter cards by language', async () => {
      const { result } = renderHook(() => useCardCollection())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      const englishCards = result.current.getCardsByLanguage('en')
      expect(englishCards).toHaveLength(2)
      expect(englishCards.every(card => card.language === 'en')).toBe(true)

      const spanishCards = result.current.getCardsByLanguage('es')
      expect(spanishCards).toHaveLength(1)
      expect(spanishCards[0].word).toBe('casa')
    })

    it('should filter cards by rarity', async () => {
      const { result } = renderHook(() => useCardCollection())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      const commonCards = result.current.getCardsByRarity('common')
      expect(commonCards).toHaveLength(1)

      const rareCards = result.current.getCardsByRarity('rare')
      expect(rareCards).toHaveLength(1)

      const epicCards = result.current.getCardsByRarity('epic')
      expect(epicCards).toHaveLength(1)
    })

    it('should clear collection and reset stats', async () => {
      ;(supabaseService.getUserCollectedCards as any).mockResolvedValue([mockCard])

      const { result } = renderHook(() => useCardCollection())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.collectedCards).toHaveLength(1)

      act(() => {
        result.current.clearCollection()
      })

      expect(result.current.collectedCards).toHaveLength(0)
      expect(result.current.stats.totalCards).toBe(0)
      expect(result.current.stats.xp).toBe(0)
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('languages-go-stats')
    })
  })

  describe('Level Calculation', () => {
    it('should calculate level correctly based on XP', async () => {
      ;(supabaseService.getUserCollectedCards as any).mockResolvedValue([])
      ;(supabaseService.collectCard as any).mockResolvedValue(undefined)

      const { result } = renderHook(() => useCardCollection())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Level 1: 0-99 XP
      expect(result.current.stats.level).toBe(1)

      // Collect enough cards to reach level 2 (100+ XP)
      const highValueCard: VocabularyCard = {
        ...mockCard,
        id: '2',
        difficulty: 3,
        rarity: 'epic' // 3 * 10 + 50 = 80 XP
      }

      await act(async () => {
        await result.current.collectCard(highValueCard)
      })

      expect(result.current.stats.xp).toBe(100)
      expect(result.current.stats.level).toBe(2)
    })
  })
}) 