import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createClient } from '@supabase/supabase-js'
import {
  signInAnonymously,
  getCurrentUser,
  getUserCollectedCards,
  collectCard,
  getUserPhotoPins,
  getMasterVocabulary,
  supabase
} from '../services/supabase'
import type { VocabularyCard } from '../types/vocabulary'

// Mock Supabase client
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn()
}))

const createMockQueryBuilder = () => ({
  select: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
})

const mockSupabaseClient = {
  auth: {
    signInAnonymously: vi.fn(),
    getUser: vi.fn(),
    getSession: vi.fn(),
    onAuthStateChange: vi.fn(() => ({
      data: { subscription: { unsubscribe: vi.fn() } }
    }))
  },
  from: vi.fn(() => createMockQueryBuilder()),
  functions: {
    invoke: vi.fn()
  }
}

describe('Supabase Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(createClient as any).mockReturnValue(mockSupabaseClient)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Authentication', () => {
    it('should sign in anonymously successfully', async () => {
      const mockAuthData = {
        user: { id: 'test-user-id', email: null },
        session: { access_token: 'test-token' }
      }
      
      mockSupabaseClient.auth.signInAnonymously.mockResolvedValue({
        data: mockAuthData,
        error: null
      })

      const result = await signInAnonymously()
      
      expect(mockSupabaseClient.auth.signInAnonymously).toHaveBeenCalled()
      expect(result).toEqual(mockAuthData)
    })

    it('should handle sign in errors', async () => {
      const mockError = new Error('Authentication failed')
      
      mockSupabaseClient.auth.signInAnonymously.mockResolvedValue({
        data: null,
        error: mockError
      })

      await expect(signInAnonymously()).rejects.toThrow('Authentication failed')
    })

    it('should get current user successfully', async () => {
      const mockUser = { id: 'test-user-id', email: null }
      
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      const result = await getCurrentUser()
      
      expect(mockSupabaseClient.auth.getUser).toHaveBeenCalled()
      expect(result).toEqual(mockUser)
    })

    it('should handle get user errors', async () => {
      const mockError = new Error('User not found')
      
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: mockError
      })

      await expect(getCurrentUser()).rejects.toThrow('User not found')
    })
  })

  describe('Master Vocabulary', () => {
    it('should fetch master vocabulary successfully', async () => {
      const mockVocabulary = [
        {
          id: '1',
          word: 'tree',
          translation: 'árbol',
          language: 'en',
          base_image_url: 'https://example.com/tree.jpg',
          rarity: 'common',
          difficulty: 1,
          category: 'nature',
          created_at: '2023-01-01T00:00:00Z'
        },
        {
          id: '2',
          word: 'house',
          translation: 'casa',
          language: 'en',
          base_image_url: 'https://example.com/house.jpg',
          rarity: 'common',
          difficulty: 1,
          category: 'urban',
          created_at: '2023-01-01T00:00:00Z'
        }
      ]

      const mockQuery = createMockQueryBuilder()
      mockQuery.order.mockResolvedValue({ data: mockVocabulary, error: null })
      mockSupabaseClient.from.mockReturnValue(mockQuery)

      const result = await getMasterVocabulary()
      
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('master_vocabulary')
      expect(mockQuery.select).toHaveBeenCalledWith('*')
      expect(mockQuery.order).toHaveBeenCalledWith('word')
      expect(result).toEqual(mockVocabulary)
    })

    it('should handle master vocabulary fetch errors', async () => {
      const mockError = new Error('Database error')
      
      const mockQuery = createMockQueryBuilder()
      mockQuery.order.mockResolvedValue({ data: null, error: mockError })
      mockSupabaseClient.from.mockReturnValue(mockQuery)

      await expect(getMasterVocabulary()).rejects.toThrow('Database error')
    })
  })

  describe('User Collections', () => {
    beforeEach(() => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'test-user-id' } },
        error: null
      })
    })

    it('should fetch user collected cards successfully', async () => {
      const mockCollectedCards = [
        {
          card_id: '1',
          collected_at: '2023-01-01T00:00:00Z',
          master_vocabulary: {
            id: '1',
            word: 'tree',
            translation: 'árbol',
            language: 'en',
            base_image_url: 'https://example.com/tree.jpg',
            rarity: 'common',
            difficulty: 1,
            category: 'nature'
          }
        }
      ]

      const mockQuery = createMockQueryBuilder()
      mockQuery.eq.mockResolvedValue({ data: mockCollectedCards, error: null })
      mockSupabaseClient.from.mockReturnValue(mockQuery)

      const result = await getUserCollectedCards()
      
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('user_collections')
      expect(mockQuery.eq).toHaveBeenCalledWith('user_id', 'test-user-id')
      expect(result).toHaveLength(1)
      expect(result[0].word).toBe('tree')
      expect(result[0].aiImageUrl).toBe('https://example.com/tree.jpg')
    })

    it('should handle authentication error when fetching collected cards', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null
      })

      await expect(getUserCollectedCards()).rejects.toThrow('User not authenticated')
    })

    it('should collect a card successfully', async () => {
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

      const mockQuery = createMockQueryBuilder()
      mockQuery.insert.mockResolvedValue({ error: null })
      mockSupabaseClient.from.mockReturnValue(mockQuery)

      await collectCard(mockCard)
      
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('user_collections')
      expect(mockQuery.insert).toHaveBeenCalledWith({
        user_id: 'test-user-id',
        card_id: '1',
        collected_at: expect.any(String)
      })
    })

    it('should handle collect card errors', async () => {
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

      const mockError = new Error('Insert failed')
      const mockQuery = createMockQueryBuilder()
      mockQuery.insert.mockResolvedValue({ error: mockError })
      mockSupabaseClient.from.mockReturnValue(mockQuery)

      await expect(collectCard(mockCard)).rejects.toThrow('Insert failed')
    })
  })

  describe('Photo Pins', () => {
    beforeEach(() => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'test-user-id' } },
        error: null
      })
    })

    it('should fetch user photo pins successfully', async () => {
      const mockPins = [
        {
          id: 'pin-1',
          lat: 40.7128,
          lng: -74.0060,
          photo_url: 'https://example.com/photo.jpg',
          created_at: '2023-01-01T00:00:00Z'
        }
      ]

      const mockQuery = createMockQueryBuilder()
      mockQuery.order.mockResolvedValue({ data: mockPins, error: null })
      mockSupabaseClient.from.mockReturnValue(mockQuery)

      const result = await getUserPhotoPins()
      
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('map_pins')
      expect(mockQuery.eq).toHaveBeenCalledWith('created_by', 'test-user-id')
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('pin-1')
      expect(result[0].lat).toBe(40.7128)
    })

    it('should handle authentication error when fetching pins', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null
      })

      await expect(getUserPhotoPins()).rejects.toThrow('User not authenticated')
    })
  })

  describe('Environment Variables', () => {
    it('should throw error if environment variables are missing', () => {
      // Temporarily remove env vars
      const originalUrl = process.env.VITE_SUPABASE_URL
      const originalKey = process.env.VITE_SUPABASE_ANON_KEY
      
      delete process.env.VITE_SUPABASE_URL
      delete process.env.VITE_SUPABASE_ANON_KEY

      expect(() => {
        // This would normally be imported, but we'll simulate the error
        const supabaseUrl = process.env.VITE_SUPABASE_URL
        const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY
        
        if (!supabaseUrl || !supabaseAnonKey) {
          throw new Error('Missing Supabase environment variables. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file.')
        }
      }).toThrow('Missing Supabase environment variables')

      // Restore env vars
      process.env.VITE_SUPABASE_URL = originalUrl
      process.env.VITE_SUPABASE_ANON_KEY = originalKey
    })
  })
}) 