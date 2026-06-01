#!/usr/bin/env node
/**
 * Verifies AGENTS.md reflects parsed repository context (post-update sanity check).
 */

import fs from 'node:fs'
import path from 'node:path'

const ROOT = process.cwd()
const CONTEXT_PATH = path.join(ROOT, '.github', 'agents-md-context.json')
const AGENTS_PATH = path.join(ROOT, 'AGENTS.md')

function fail(message) {
  console.error(`::error::${message}`)
  process.exitCode = 1
}

function warn(message) {
  console.warn(`::warning::${message}`)
}

if (!fs.existsSync(CONTEXT_PATH)) {
  fail(`Missing ${path.relative(ROOT, CONTEXT_PATH)}. Run: node scripts/generate-agents-context.mjs`)
  process.exit(1)
}

if (!fs.existsSync(AGENTS_PATH)) {
  fail('Missing AGENTS.md in repository root.')
  process.exit(1)
}

const context = JSON.parse(fs.readFileSync(CONTEXT_PATH, 'utf8'))
const agents = fs.readFileSync(AGENTS_PATH, 'utf8')

/** @param {string} value */
function isReferenced(value) {
  if (agents.includes(value)) return true
  const base = value.replace(/\.(ts|yml|mdc)$/, '')
  if (base !== value && agents.includes(base)) return true
  return false
}

const missingStores = context.stores.map((s) => s.file).filter((file) => !isReferenced(file))

if (missingStores.length > 0) {
  fail(`AGENTS.md does not mention store file(s): ${missingStores.join(', ')}`)
}

const missingWorkflows = context.workflows.filter((wf) => !isReferenced(wf))
if (missingWorkflows.length > 0) {
  fail(`AGENTS.md does not mention workflow(s): ${missingWorkflows.join(', ')}`)
}

for (const scriptName of ['dev', 'build', 'test:run']) {
  if (context.package.scripts[scriptName] && !agents.includes(scriptName)) {
    warn(`AGENTS.md may be missing npm script reference: ${scriptName}`)
  }
}

if (context.flags.hasCiWorkflow && agents.includes('only deploy on main exists')) {
  fail('AGENTS.md still claims only deploy workflow exists, but ci.yml is present.')
}

if (context.repository.hasPackagesDir && !agents.includes('packages/')) {
  warn('Repository has packages/ but AGENTS.md may not document monorepo layout.')
}

if (process.exitCode === 0) {
  console.log('AGENTS.md structural validation passed.')
}
