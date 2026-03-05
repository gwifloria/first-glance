const ONBOARDING_KEY = 'onboarding_completed'
const BLOCKSITE_HINT_KEY = 'onboarding_blocksite_seen'

export async function shouldShowOnboarding(): Promise<boolean> {
  return new Promise((resolve) => {
    chrome.storage.local.get(ONBOARDING_KEY, (result) => {
      resolve(!result[ONBOARDING_KEY])
    })
  })
}

export function completeOnboarding(): void {
  chrome.storage.local.set({ [ONBOARDING_KEY]: true })
}

/** phase 1 完成后、blocksite 未被打开过时显示引导点 */
export async function shouldShowBlocksiteHint(): Promise<boolean> {
  return new Promise((resolve) => {
    chrome.storage.local.get([ONBOARDING_KEY, BLOCKSITE_HINT_KEY], (result) => {
      resolve(!!result[ONBOARDING_KEY] && !result[BLOCKSITE_HINT_KEY])
    })
  })
}

export function completeBlocksiteOnboarding(): void {
  chrome.storage.local.set({ [BLOCKSITE_HINT_KEY]: true })
}
