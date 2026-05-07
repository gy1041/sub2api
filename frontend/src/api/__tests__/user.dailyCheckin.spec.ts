import { beforeEach, describe, expect, it, vi } from 'vitest'

const { get, post } = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
}))

vi.mock('@/api/client', () => ({
  apiClient: {
    get,
    post,
  },
}))

import {
  claimDailyCheckin,
  getDailyCheckinStatus,
  type DailyCheckinClaimResult,
  type DailyCheckinStatus,
} from '@/api/user'

describe('user daily check-in api', () => {
  beforeEach(() => {
    get.mockReset()
    post.mockReset()
  })

  it('fetches current user daily check-in status with backend snake_case fields', async () => {
    const payload: DailyCheckinStatus = {
      enabled: true,
      claimed_today: false,
      reward: null,
      balance: 8.5,
      min_reward: 1,
      max_reward: 3,
      checkin_date: '2026-05-08',
      claimed_at: null,
    }
    get.mockResolvedValue({ data: payload })

    const result = await getDailyCheckinStatus()

    expect(get).toHaveBeenCalledWith('/user/daily-checkin')
    expect(result).toEqual(payload)
  })

  it('claims the current user daily reward through the dedicated endpoint', async () => {
    const payload: DailyCheckinClaimResult = {
      enabled: true,
      claimed_today: true,
      already_claimed: false,
      reward: 2.25,
      balance: 10.75,
      min_reward: 1,
      max_reward: 3,
      checkin_date: '2026-05-08',
      claimed_at: '2026-05-08T08:00:00Z',
    }
    post.mockResolvedValue({ data: payload })

    const result = await claimDailyCheckin()

    expect(post).toHaveBeenCalledWith('/user/daily-checkin')
    expect(result).toEqual(payload)
  })
})
