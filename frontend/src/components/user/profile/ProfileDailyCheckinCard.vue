<template>
  <div v-if="status" class="card" data-testid="profile-daily-checkin-card">
    <div class="border-b border-gray-100 px-6 py-4 dark:border-dark-700">
      <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 class="text-lg font-medium text-gray-900 dark:text-white">
            {{ t('profile.dailyCheckin.title') }}
          </h2>
          <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {{ t('profile.dailyCheckin.description') }}
          </p>
        </div>
        <span
          class="inline-flex w-fit items-center rounded-full px-3 py-1 text-xs font-medium"
          :class="badgeClass"
        >
          {{ badgeLabel }}
        </span>
      </div>
    </div>

    <div class="space-y-5 px-6 py-6">
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <p class="text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
            {{ t('profile.dailyCheckin.rewardRange') }}
          </p>
          <p class="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
            {{ formatMoney(status.min_reward) }} - {{ formatMoney(status.max_reward) }}
          </p>
        </div>
        <div>
          <p class="text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
            {{ t('profile.dailyCheckin.currentBalance') }}
          </p>
          <p class="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
            {{ formatMoney(status.balance) }}
          </p>
        </div>
        <div>
          <p class="text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
            {{ t('profile.dailyCheckin.todayReward') }}
          </p>
          <p class="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
            {{ status.reward != null ? formatMoney(status.reward) : t('profile.dailyCheckin.pendingReward') }}
          </p>
        </div>
      </div>

      <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p class="text-sm text-gray-500 dark:text-gray-400">
          {{ hintLabel }}
        </p>
        <button
          type="button"
          class="btn btn-primary inline-flex items-center justify-center gap-2"
          :disabled="claiming || !status.enabled || status.claimed_today"
          data-testid="profile-daily-checkin-claim-button"
          @click="claim"
        >
          <span v-if="claiming" class="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"></span>
          {{ buttonLabel }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { userAPI } from '@/api'
import { useAppStore } from '@/stores/app'
import { useAuthStore } from '@/stores/auth'
import { extractApiErrorMessage } from '@/utils/apiError'
import { formatCurrency } from '@/utils/format'
import type { DailyCheckinStatus } from '@/api/user'

const { t } = useI18n()
const appStore = useAppStore()
const authStore = useAuthStore()
const status = ref<DailyCheckinStatus | null>(null)
const claiming = ref(false)

function formatMoney(value: number): string {
  return formatCurrency(value)
}

const badgeClass = computed(() => {
  if (!status.value?.enabled) {
    return 'bg-gray-100 text-gray-600 dark:bg-dark-700 dark:text-gray-300'
  }
  if (status.value.claimed_today) {
    return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
  }
  return 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300'
})

const badgeLabel = computed(() => {
  if (!status.value?.enabled) {
    return t('profile.dailyCheckin.disabled')
  }
  return status.value.claimed_today
    ? t('profile.dailyCheckin.claimed')
    : t('profile.dailyCheckin.available')
})

const hintLabel = computed(() => {
  if (!status.value?.enabled) {
    return t('profile.dailyCheckin.disabledHint')
  }
  return status.value.claimed_today
    ? t('profile.dailyCheckin.claimedHint')
    : t('profile.dailyCheckin.availableHint')
})

const buttonLabel = computed(() => {
  if (!status.value?.enabled) {
    return t('profile.dailyCheckin.disabledButton')
  }
  return status.value.claimed_today
    ? t('profile.dailyCheckin.claimedButton')
    : t('profile.dailyCheckin.claimButton')
})

async function loadStatus(): Promise<void> {
  status.value = await userAPI.getDailyCheckinStatus()
}

async function claim(): Promise<void> {
  if (!status.value || status.value.claimed_today || claiming.value) return
  claiming.value = true
  try {
    const result = await userAPI.claimDailyCheckin()
    status.value = result
    await authStore.refreshUser()
    if (!result.already_claimed && result.reward != null) {
      appStore.showSuccess(t('profile.dailyCheckin.claimSuccess', { amount: formatMoney(result.reward) }))
    }
  } catch (error) {
    appStore.showError(extractApiErrorMessage(error, t('profile.dailyCheckin.claimFailed')))
  } finally {
    claiming.value = false
  }
}

onMounted(() => {
  loadStatus().catch((error) => {
    appStore.showError(extractApiErrorMessage(error, t('profile.dailyCheckin.loadFailed')))
  })
})
</script>
