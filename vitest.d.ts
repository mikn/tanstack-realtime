import 'vitest'

declare module 'vitest' {
  export interface ProvidedContext {
    centrifugoPort: number
  }
}
