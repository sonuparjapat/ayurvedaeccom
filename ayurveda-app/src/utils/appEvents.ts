// Lightweight in-process event bus.
// useOrderSocket publishes here; individual screens subscribe without opening extra socket connections.
type Listener = (data: any) => void
const registry: Record<string, Set<Listener>> = {}

export const appEvents = {
  emit(event: string, data: any) {
    registry[event]?.forEach(fn => fn(data))
  },
  /** Returns an unsubscribe function — call it in useEffect cleanup. */
  on(event: string, fn: Listener): () => void {
    if (!registry[event]) registry[event] = new Set()
    registry[event].add(fn)
    return () => registry[event].delete(fn)
  },
}
