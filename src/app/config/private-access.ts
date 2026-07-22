export const PRIVATE_ACCESS_CODE = 'ludi1997'
export const PRIVATE_ACCESS_STORAGE_KEY = 'ludi-tools-unlocked'

export function isPrivateAccessUnlocked(): boolean {
  try {
    return typeof localStorage !== 'undefined' && localStorage.getItem(PRIVATE_ACCESS_STORAGE_KEY) === 'true'
  } catch {
    return false
  }
}

export function unlockPrivateAccess(): void {
  try {
    localStorage.setItem(PRIVATE_ACCESS_STORAGE_KEY, 'true')
  } catch {
    // The current view can still be unlocked when storage is unavailable.
  }
}
