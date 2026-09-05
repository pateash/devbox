import type { DevBoxApi } from '../shared/contracts'

declare global {
  interface Window { devbox: DevBoxApi }
}

export {}
