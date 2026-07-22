import { Injectable } from '@angular/core'

@Injectable({ providedIn: 'root' })
export class ToolsDraftService {
  private static DATABASE_NAME = 'ludi-tools-drafts'
  private static STORE_NAME = 'media'
  private static MEDIA_KEY = 'current'

  public readJson<T>(key: string): T | undefined {
    try {
      const stored = window.localStorage.getItem(key)
      return stored ? JSON.parse(stored) as T : undefined
    } catch {
      return undefined
    }
  }

  public writeJson(key: string, value: unknown): boolean {
    try {
      window.localStorage.setItem(key, JSON.stringify(value))
      return true
    } catch {
      return false
    }
  }

  public remove(key: string): void {
    try {
      window.localStorage.removeItem(key)
    } catch {
      // Storage may be unavailable in private browsing or restricted contexts.
    }
  }

  public async readMedia<T>(): Promise<T | undefined> {
    let database: IDBDatabase | undefined
    try {
      database = await this.openDatabase()
      const transaction = database.transaction(ToolsDraftService.STORE_NAME, 'readonly')
      const transactionDone = this.waitForTransaction(transaction)
      const request = transaction.objectStore(ToolsDraftService.STORE_NAME).get(ToolsDraftService.MEDIA_KEY)
      const stateRequest = new Promise<T | undefined>((resolve, reject) => {
        request.onsuccess = () => resolve(request.result as T | undefined)
        request.onerror = () => reject(request.error || new Error('Brouillon média illisible.'))
      })
      const [state] = await Promise.all([stateRequest, transactionDone])
      return state
    } catch {
      return undefined
    } finally {
      database?.close()
    }
  }

  public async writeMedia(value: unknown): Promise<boolean> {
    let database: IDBDatabase | undefined
    try {
      database = await this.openDatabase()
      const transaction = database.transaction(ToolsDraftService.STORE_NAME, 'readwrite')
      const transactionDone = this.waitForTransaction(transaction)
      transaction.objectStore(ToolsDraftService.STORE_NAME).put(value, ToolsDraftService.MEDIA_KEY)
      await transactionDone
      return true
    } catch {
      return false
    } finally {
      database?.close()
    }
  }

  private openDatabase(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      if (typeof indexedDB === 'undefined') {
        reject(new Error('IndexedDB indisponible.'))
        return
      }

      const request = indexedDB.open(ToolsDraftService.DATABASE_NAME, 1)
      request.onupgradeneeded = () => {
        const database = request.result
        if (!database.objectStoreNames.contains(ToolsDraftService.STORE_NAME)) {
          database.createObjectStore(ToolsDraftService.STORE_NAME)
        }
      }
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error || new Error('IndexedDB indisponible.'))
      request.onblocked = () => reject(new Error('IndexedDB est bloqué par un autre onglet.'))
    })
  }

  private waitForTransaction(transaction: IDBTransaction): Promise<void> {
    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve()
      transaction.onerror = () => reject(transaction.error || new Error('Sauvegarde impossible.'))
      transaction.onabort = () => reject(transaction.error || new Error('Sauvegarde annulée.'))
    })
  }
}
