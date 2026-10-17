import { readdirSync, readFileSync, statSync } from 'node:fs'
import { resolve, sep } from 'node:path'
import process from 'node:process'
import { runInNewContext } from 'node:vm'

import { describe, expect, it } from 'vitest'

import { APPLICATION_ROUTES } from './deepLinks'

const publicDir = resolve(process.cwd(), 'public')
const source = readFileSync(resolve(process.cwd(), '../infrastructure/edge/spa-routing.js'), 'utf8')

function rewrite(uri: string): string {
  const sandbox: { handler?: (event: { request: { uri: string } }) => { uri: string } } = {}
  runInNewContext(source, sandbox)
  if (!sandbox.handler) throw new Error('spa-routing.js did not define handler')
  return sandbox.handler({ request: { uri } }).uri
}

describe('CloudFront SPA routing', () => {
  it('rewrites every application route, including control ids that contain dots', () => {
    for (const path of APPLICATION_ROUTES) {
      expect(rewrite(path), path).toBe('/index.html')
    }
  })

  it('does not treat a dotted clause id as a static file', () => {
    expect(rewrite('/assess/iso42001/financeguard-ai/controls/iso-fg-6.1.2')).toBe('/index.html')
    expect(rewrite('/assets/app.6.1.2')).toBe('/index.html')
  })

  it('leaves known static assets on their object keys', () => {
    const assets = [
      '/assets/index-Co6iEA4O.js',
      '/assets/index-C6UZNqwe.css',
      '/assets/inter-latin.woff2',
      '/images/grail-governance-hero-poster.svg',
      '/images/grail-hero-governance.jpg',
      '/videos/grail-governance-hero.webm',
      '/videos/grail-governance-hero.mp4',
      '/favicon.ico',
      '/config.json',
    ]
    for (const path of assets) expect(rewrite(path), path).toBe(path)
  })


  it('serves every published file in frontend/public from S3', () => {
    const files = readdirSync(publicDir, { recursive: true })
      .filter((path) => statSync(resolve(publicDir, path)).isFile() && !path.split(sep).pop()?.startsWith('.'))
      .map((path) => `/${path.split(sep).join('/')}`)
    expect(files.length).toBeGreaterThan(0)
    for (const path of files) expect(rewrite(path), path).toBe(path)
  })
})
