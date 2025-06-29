import { describe, it, expect } from 'vitest'

describe('Simple Tests', () => {
  it('should pass basic math test', () => {
    expect(1 + 1).toBe(2)
  })

  it('should handle string operations', () => {
    const greeting = 'Hello'
    const name = 'World'
    expect(`${greeting} ${name}`).toBe('Hello World')
  })

  it('should work with arrays', () => {
    const arr = [1, 2, 3]
    expect(arr).toHaveLength(3)
    expect(arr).toContain(2)
  })

  it('should handle async operations', async () => {
    const promise = Promise.resolve('test')
    await expect(promise).resolves.toBe('test')
  })

  it('should validate environment variables', () => {
    expect(process.env.VITE_SUPABASE_URL).toBe('https://test.supabase.co')
    expect(process.env.VITE_SUPABASE_ANON_KEY).toBe('test-anon-key')
  })
}) 