const store = new Map<string, string>()

Object.defineProperty(globalThis, 'localStorage', {
  value: {
    getItem(key: string): string | null {
      const v = store.get(key)
      return v === undefined ? null : v
    },
    setItem(key: string, value: string): void {
      store.set(key, value)
    },
    removeItem(key: string): void {
      store.delete(key)
    },
    clear(): void {
      store.clear()
    },
    key(i: number): string | null {
      const k = [...store.keys()][i]
      return k === undefined ? null : k
    },
    get length(): number {
      return store.size
    },
  },
})
