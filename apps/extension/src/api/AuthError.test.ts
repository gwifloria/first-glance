import { describe, it, expect } from 'vitest'
import { AuthError } from './AuthError'

describe('AuthError', () => {
  it('instanceof Error 为 true', () => {
    const err = new AuthError('test', 401)
    expect(err).toBeInstanceOf(Error)
  })

  it('name 为 AuthError', () => {
    const err = new AuthError('test', 401)
    expect(err.name).toBe('AuthError')
  })

  it('status 存储正确', () => {
    const err = new AuthError('Unauthorized', 401)
    expect(err.status).toBe(401)

    const err2 = new AuthError('Forbidden', 403)
    expect(err2.status).toBe(403)
  })

  it('message 存储正确', () => {
    const err = new AuthError('Token expired', 401)
    expect(err.message).toBe('Token expired')
  })
})
