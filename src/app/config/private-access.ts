export const PRIVATE_ACCESS_CODE = 'ludi1997'
export const PRIVATE_ACCESS_STORAGE_KEY = 'ludi-tools-unlocked'

export function isPrivateAccessUnlocked(): boolean {
  return localStorage.getItem(PRIVATE_ACCESS_STORAGE_KEY) === 'true'
}

export function unlockPrivateAccess(): void {
  localStorage.setItem(PRIVATE_ACCESS_STORAGE_KEY, 'true')
}
