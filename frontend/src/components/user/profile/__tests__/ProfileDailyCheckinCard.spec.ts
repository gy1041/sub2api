import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ProfileDailyCheckinCard from '@/components/user/profile/ProfileDailyCheckinCard.vue'

const {
  getDailyCheckinStatusMock,
  claimDailyCheckinMock,
  refreshUserMock,
  showSuccessMock,
  showErrorMock,
} = vi.hoisted(() => ({
  getDailyCheckinStatusMock: vi.fn(),
  claimDailyCheckinMock: vi.fn(),
  refreshUserMock: vi.fn(),
  showSuccessMock: vi.fn(),
  showErrorMock: vi.fn(),
}))

vi.mock('@/api', () => ({
  userAPI: {
    getDailyCheckinStatus: getDailyCheckinStatusMock,
    claimDailyCheckin: claimDailyCheckinMock,
  },
}))

vi.mock('@/stores/app', () => ({
  useAppStore: () => ({
    showSuccess: showSuccessMock,
    showError: showErrorMock,
  }),
}))

vi.mock('@/stores/auth', () => ({
  useAuthStore: () => ({
    refreshUser: refreshUserMock,
  }),
}))

vi.mock('@/utils/apiError', () => ({
  extractApiErrorMessage: (error: unknown, fallback: string) =>
    error instanceof Error ? error.message : fallback,
}))

vi.mock('@/utils/format', () => ({
  formatCurrency: (value: number | null | undefined) => `$${Number(value ?? 0).toFixed(2)}`,
}))

vi.mock('vue-i18n', async (importOriginal) => {
  const actual = await importOriginal<typeof import('vue-i18n')>()
  return {
    ...actual,
    useI18n: () => ({
      t: (key: string, params?: Record<string, string>) =>
        key === 'profile.dailyCheckin.claimSuccess'
          ? `claim-success:${params?.amount ?? ''}`
          : key,
    }),
  }
})

describe('ProfileDailyCheckinCard', () => {
  beforeEach(() => {
    getDailyCheckinStatusMock.mockReset()
    claimDailyCheckinMock.mockReset()
    refreshUserMock.mockReset()
    showSuccessMock.mockReset()
    showErrorMock.mockReset()
    refreshUserMock.mockResolvedValue(undefined)
  })

  it('renders disabled state when the feature is turned off', async () => {
    getDailyCheckinStatusMock.mockResolvedValue({
      enabled: false,
      claimed_today: false,
      reward: null,
      balance: 12,
      min_reward: 0,
      max_reward: 0,
      checkin_date: '2026-05-08',
      claimed_at: null,
    })

    const wrapper = mount(ProfileDailyCheckinCard)
    await flushPromises()

    expect(wrapper.get('[data-testid="profile-daily-checkin-card"]').text()).toContain('profile.dailyCheckin.disabled')
    const button = wrapper.get('[data-testid="profile-daily-checkin-claim-button"]')
    expect((button.element as HTMLButtonElement).disabled).toBe(true)
    expect(button.text()).toContain('profile.dailyCheckin.disabledButton')
    expect(claimDailyCheckinMock).not.toHaveBeenCalled()
  })

  it('claims the reward, refreshes the user, and shows a success toast', async () => {
    getDailyCheckinStatusMock.mockResolvedValue({
      enabled: true,
      claimed_today: false,
      reward: null,
      balance: 10,
      min_reward: 1,
      max_reward: 2,
      checkin_date: '2026-05-08',
      claimed_at: null,
    })
    claimDailyCheckinMock.mockResolvedValue({
      enabled: true,
      claimed_today: true,
      already_claimed: false,
      reward: 1.5,
      balance: 11.5,
      min_reward: 1,
      max_reward: 2,
      checkin_date: '2026-05-08',
      claimed_at: '2026-05-08T01:02:03Z',
    })

    const wrapper = mount(ProfileDailyCheckinCard)
    await flushPromises()

    await wrapper.get('[data-testid="profile-daily-checkin-claim-button"]').trigger('click')
    await flushPromises()

    expect(claimDailyCheckinMock).toHaveBeenCalledTimes(1)
    expect(refreshUserMock).toHaveBeenCalledTimes(1)
    expect(showSuccessMock).toHaveBeenCalledWith('claim-success:$1.50')
    expect(wrapper.text()).toContain('$11.50')
    expect(wrapper.text()).toContain('$1.50')
  })

  it('uses the successful already-claimed claim response without showing a duplicate reward toast', async () => {
    getDailyCheckinStatusMock.mockResolvedValue({
      enabled: true,
      claimed_today: false,
      reward: null,
      balance: 10,
      min_reward: 1,
      max_reward: 2,
      checkin_date: '2026-05-08',
      claimed_at: null,
    })
    claimDailyCheckinMock.mockResolvedValue({
      enabled: true,
      claimed_today: true,
      already_claimed: true,
      reward: 1.25,
      balance: 11.25,
      min_reward: 1,
      max_reward: 2,
      checkin_date: '2026-05-08',
      claimed_at: '2026-05-08T01:02:03Z',
    })

    const wrapper = mount(ProfileDailyCheckinCard)
    await flushPromises()

    await wrapper.get('[data-testid="profile-daily-checkin-claim-button"]').trigger('click')
    await flushPromises()

    expect(claimDailyCheckinMock).toHaveBeenCalledTimes(1)
    expect(getDailyCheckinStatusMock).toHaveBeenCalledTimes(1)
    expect(showErrorMock).not.toHaveBeenCalled()
    expect(showSuccessMock).not.toHaveBeenCalled()
    expect(refreshUserMock).toHaveBeenCalledTimes(1)
    expect(wrapper.text()).toContain('profile.dailyCheckin.claimed')
    expect(wrapper.text()).toContain('$11.25')
    expect(wrapper.text()).toContain('$1.25')
  })

  it('shows an error toast when claiming fails', async () => {
    getDailyCheckinStatusMock.mockResolvedValue({
      enabled: true,
      claimed_today: false,
      reward: null,
      balance: 10,
      min_reward: 1,
      max_reward: 2,
      checkin_date: '2026-05-08',
      claimed_at: null,
    })
    claimDailyCheckinMock.mockRejectedValue(new Error('claim failed'))

    const wrapper = mount(ProfileDailyCheckinCard)
    await flushPromises()

    await wrapper.get('[data-testid="profile-daily-checkin-claim-button"]').trigger('click')
    await flushPromises()

    expect(showErrorMock).toHaveBeenCalledWith('claim failed')
    expect(refreshUserMock).not.toHaveBeenCalled()
  })

  it('shows an error toast when loading status fails', async () => {
    getDailyCheckinStatusMock.mockRejectedValue(new Error('load failed'))

    mount(ProfileDailyCheckinCard)
    await flushPromises()

    expect(showErrorMock).toHaveBeenCalledWith('load failed')
  })
})
