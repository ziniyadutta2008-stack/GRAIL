/** Types for Node builtins used by Vitest file fixtures. The app compile does not include @types/node. */
declare module 'node:fs' {
  export function readFileSync(path: string): ArrayBuffer
  export function readFileSync(path: string, encoding: 'utf8'): string
  export function readdirSync(path: string, options: { recursive: true }): string[]
  export function statSync(path: string): { isFile(): boolean }
}

declare module 'node:path' {
  export function resolve(...segments: string[]): string
  export const sep: string
}

declare module 'node:process' {
  const process: { cwd(): string }
  export default process
}

declare module 'node:vm' {
  export function runInNewContext(code: string, context: object): unknown
}
