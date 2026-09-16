/** Small unique id: time + random, good enough for one phone. */
export const uid = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
