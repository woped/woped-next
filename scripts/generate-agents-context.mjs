#!/usr/bin/env node
/**
 * Parses repository structure and writes machine-readable context for AGENTS.md updates.
 * Used by .github/workflows/update-agents-md.yml before OpenCode runs.
 */

import fs from 'node:fs'
import path from 'node:path'

const ROOT = process.cwd()
const OUTPUT = path.join(ROOT, '.github', 'agents-md-context.json')

function exists(p) {
  return fs.existsSync(path.join(ROOT, p))
}

function readJson(p) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf8'))
}

function listFiles(dir, { extension } = {}) {
  const full = path.join(ROOT, dir)
  if (!fs.existsSync(full)) return []
  return fs
    .readdirSync(full, { withFileTypes: true })
    .filter((e) => e.isFile())
    .map((e) => e.name)
    .filter((name) => !extension || name.endsWith(extension))
    .sort()
}

function listDirs(dir) {
  const full = path.join(ROOT, dir)
  if (!fs.existsSync(full)) return []
  return fs
    .readdirSync(full, { withFileTypes: true })
    .filter((e) => e.isDirectory() && !e.name.startsWith('.'))
    .map((e) => e.name)
    .sort()
}

function walkServiceTree(relativeDir) {
  const full = path.join(ROOT, relativeDir)
  if (!fs.existsSync(full)) return []

  const entries = fs.readdirSync(full, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))
  const result = []

  for (const entry of entries) {
    const rel = path.join(relativeDir, entry.name).replace(/\\/g, '/')
    if (entry.isDirectory()) {
      result.push({ type: 'dir', path: rel, children: walkServiceTree(rel) })
    } else if (entry.name.endsWith('.ts')) {
      result.push({ type: 'file', path: rel })
    }
  }

  return result
}

function versionFromRange(range) {
  if (!range || typeof range !== 'string') return range
  const match = range.match(/(\d+\.\d+(?:\.\d+)?)/)
  return match ? match[1] : range
}

function mapPackageVersions(deps) {
  const mapped = {}
  for (const [name, range] of Object.entries(deps ?? {})) {
    mapped[name] = { range, versionHint: versionFromRange(range) }
  }
  return mapped
}

const pkg = readJson('package.json')
const stores = listFiles('src/stores', { extension: '.ts' })
const composables = listFiles('src/composables', { extension: '.ts' })
const componentFeatures = listDirs('src/components')
const workflows = listFiles('.github/workflows', { extension: '.yml' })
const cursorRules = listFiles('.cursor/rules', { extension: '.mdc' })
const tests = listFiles('src/__tests__', { extension: '.ts' })

const entryPoints = [
  { file: 'src/main.js', exists: exists('src/main.js') },
  { file: 'src/App.vue', exists: exists('src/App.vue') },
  {
    file: 'src/components/editor/PetriNetEditor.vue',
    exists: exists('src/components/editor/PetriNetEditor.vue'),
  },
]

const context = {
  generatedAt: new Date().toISOString(),
  repository: {
    layout: 'single-package',
    hasPackagesDir: exists('packages'),
    hasPnpmWorkspace: exists('pnpm-workspace.yaml'),
  },
  package: {
    name: pkg.name,
    version: pkg.version,
    scripts: pkg.scripts ?? {},
    dependencies: mapPackageVersions(pkg.dependencies),
    devDependencies: mapPackageVersions(pkg.devDependencies),
  },
  node: {
    dockerfile: exists('Dockerfile') ? readDockerfileNodeVersion() : null,
    ciWorkflow: readWorkflowNodeVersion('ci.yml'),
    deployWorkflow: readWorkflowNodeVersion('deploy.yml'),
  },
  entryPoints: entryPoints.filter((e) => e.exists),
  stores: stores.map((file) => ({
    file,
    storeId: file.replace(/\.ts$/, ''),
    exportHint: `use${toPascalCase(file.replace(/\.ts$/, ''))}Store`,
  })),
  composables,
  componentFeatures,
  services: walkServiceTree('src/services'),
  workflows,
  cursorRules,
  tests,
  docs: listDirs('docs'),
  flags: {
    hasCiWorkflow: workflows.includes('ci.yml'),
    hasDeployWorkflow: workflows.includes('deploy.yml'),
    hasTypecheckScript: Boolean(pkg.scripts?.typecheck),
    hasEslintConfig: exists('eslint.config.js') || exists('.eslintrc.cjs'),
    hasPrettierConfig: exists('.prettierrc') || exists('prettier.config.js'),
  },
}

function toPascalCase(value) {
  return value
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('')
}

function readDockerfileNodeVersion() {
  try {
    const dockerfile = fs.readFileSync(path.join(ROOT, 'Dockerfile'), 'utf8')
    const match = dockerfile.match(/node:(\d+)/i)
    return match ? match[1] : null
  } catch {
    return null
  }
}

function readWorkflowNodeVersion(workflowFile) {
  try {
    const content = fs.readFileSync(path.join(ROOT, '.github', 'workflows', workflowFile), 'utf8')
    const match = content.match(/node-version:\s*['"]?(\d+)/i)
    return match ? match[1] : null
  } catch {
    return null
  }
}

fs.mkdirSync(path.dirname(OUTPUT), { recursive: true })
fs.writeFileSync(OUTPUT, `${JSON.stringify(context, null, 2)}\n`)
console.log(`Wrote ${path.relative(ROOT, OUTPUT)}`)
console.log(`  stores: ${stores.length}, workflows: ${workflows.length}, component features: ${componentFeatures.length}`)
