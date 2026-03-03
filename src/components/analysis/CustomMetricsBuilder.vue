<script setup>
import { ref, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { usePetriNetStore } from '@/stores/petriNet'

const petriNetStore = usePetriNetStore()
const { net } = storeToRefs(petriNetStore)

const metricName = ref('')
const formula = ref('')
const validationError = ref('')

const customMetrics = ref([])
const thresholdGood = ref('')
const thresholdWarning = ref('')
const thresholdBad = ref('')

// --- Variable resolution ---

const KNOWN_VARIABLES = ['places', 'transitions', 'arcs', 'operators', 'subprocesses', 'nodes']

function resolveVariables(net) {
  const p = net.places.length
  const t = net.transitions.length
  const a = net.arcs.length
  const o = net.operators.length
  const s = net.subProcesses.length
  return {
    places: p,
    transitions: t,
    arcs: a,
    operators: o,
    subprocesses: s,
    nodes: p + t + o + s,
  }
}

// --- Tokenizer ---

const TokenType = {
  NUMBER: 'NUMBER',
  VARIABLE: 'VARIABLE',
  OPERATOR: 'OPERATOR',
  LPAREN: 'LPAREN',
  RPAREN: 'RPAREN',
}

function tokenize(input) {
  const tokens = []
  let i = 0
  while (i < input.length) {
    const ch = input[i]
    if (/\s/.test(ch)) {
      i++
      continue
    }
    if (/\d/.test(ch) || (ch === '.' && i + 1 < input.length && /\d/.test(input[i + 1]))) {
      let num = ''
      while (i < input.length && (/\d/.test(input[i]) || input[i] === '.')) {
        num += input[i++]
      }
      if (isNaN(Number(num))) return { error: `Invalid number: ${num}` }
      tokens.push({ type: TokenType.NUMBER, value: Number(num) })
      continue
    }
    if (/[a-zA-Z_]/.test(ch)) {
      let name = ''
      while (i < input.length && /[a-zA-Z_0-9]/.test(input[i])) {
        name += input[i++]
      }
      if (!KNOWN_VARIABLES.includes(name)) return { error: `Unknown variable: "${name}"` }
      tokens.push({ type: TokenType.VARIABLE, value: name })
      continue
    }
    if ('+-*/'.includes(ch)) {
      tokens.push({ type: TokenType.OPERATOR, value: ch })
      i++
      continue
    }
    if (ch === '(') {
      tokens.push({ type: TokenType.LPAREN })
      i++
      continue
    }
    if (ch === ')') {
      tokens.push({ type: TokenType.RPAREN })
      i++
      continue
    }
    return { error: `Unexpected character: "${ch}"` }
  }
  return { tokens }
}

// --- Shunting-yard evaluator ---

function precedence(op) {
  if (op === '+' || op === '-') return 1
  if (op === '*' || op === '/') return 2
  return 0
}

function applyOp(op, a, b) {
  switch (op) {
    case '+': return a + b
    case '-': return a - b
    case '*': return a * b
    case '/': return b === 0 ? NaN : a / b
  }
}

function evaluate(formulaStr, vars) {
  const { tokens, error } = tokenize(formulaStr)
  if (error) return { error }
  if (!tokens || tokens.length === 0) return { error: 'Empty formula' }

  const output = []
  const ops = []

  for (let i = 0; i < tokens.length; i++) {
    const tok = tokens[i]
    if (tok.type === TokenType.NUMBER) {
      output.push(tok.value)
    } else if (tok.type === TokenType.VARIABLE) {
      output.push(vars[tok.value] ?? 0)
    } else if (tok.type === TokenType.OPERATOR) {
      while (ops.length && ops[ops.length - 1] !== '(' && precedence(ops[ops.length - 1]) >= precedence(tok.value)) {
        const op = ops.pop()
        if (output.length < 2) return { error: 'Syntax error: not enough operands' }
        const b = output.pop()
        const a = output.pop()
        output.push(applyOp(op, a, b))
      }
      ops.push(tok.value)
    } else if (tok.type === TokenType.LPAREN) {
      ops.push('(')
    } else if (tok.type === TokenType.RPAREN) {
      while (ops.length && ops[ops.length - 1] !== '(') {
        const op = ops.pop()
        if (output.length < 2) return { error: 'Syntax error: not enough operands' }
        const b = output.pop()
        const a = output.pop()
        output.push(applyOp(op, a, b))
      }
      if (!ops.length || ops[ops.length - 1] !== '(') return { error: 'Mismatched parentheses' }
      ops.pop()
    }
  }

  while (ops.length) {
    const op = ops.pop()
    if (op === '(') return { error: 'Mismatched parentheses' }
    if (output.length < 2) return { error: 'Syntax error: not enough operands' }
    const b = output.pop()
    const a = output.pop()
    output.push(applyOp(op, a, b))
  }

  if (output.length !== 1) return { error: 'Syntax error: invalid expression' }
  const result = output[0]
  if (typeof result !== 'number' || isNaN(result)) return { error: 'Division by zero' }
  return { value: result }
}

// --- Formula preview ---

const formulaPreview = computed(() => {
  if (!formula.value.trim()) return null
  const vars = resolveVariables(net.value)
  return evaluate(formula.value.trim(), vars)
})

// --- Computed current values for custom metrics ---

function thresholdStatus(value, thresholds) {
  if (typeof value !== 'number') return null
  if (thresholds.bad !== null && value >= thresholds.bad) return 'bad'
  if (thresholds.warning !== null && value >= thresholds.warning) return 'warning'
  if (thresholds.good !== null && value <= thresholds.good) return 'good'
  return null
}

const customMetricsWithValues = computed(() => {
  const vars = resolveVariables(net.value)
  return customMetrics.value.map((m) => {
    const result = evaluate(m.formula, vars)
    const value = result.error ? result.error : result.value
    const status = thresholdStatus(value, m.thresholds)
    return { ...m, currentValue: value, status }
  })
})

// --- Actions ---

function addMetric() {
  validationError.value = ''
  const name = metricName.value.trim()
  const f = formula.value.trim()

  if (!name) {
    validationError.value = 'Metric name is required'
    return
  }
  if (!f) {
    validationError.value = 'Formula is required'
    return
  }
  if (customMetrics.value.some((m) => m.name === name)) {
    validationError.value = 'A metric with this name already exists'
    return
  }

  const vars = resolveVariables(net.value)
  const result = evaluate(f, vars)
  if (result.error) {
    validationError.value = result.error
    return
  }

  const thresholds = {
    good: thresholdGood.value.trim() ? Number(thresholdGood.value) : null,
    warning: thresholdWarning.value.trim() ? Number(thresholdWarning.value) : null,
    bad: thresholdBad.value.trim() ? Number(thresholdBad.value) : null,
  }

  customMetrics.value.push({
    id: Date.now().toString(36),
    name,
    formula: f,
    thresholds,
  })
  metricName.value = ''
  formula.value = ''
  thresholdGood.value = ''
  thresholdWarning.value = ''
  thresholdBad.value = ''
}

function removeMetric(id) {
  customMetrics.value = customMetrics.value.filter((m) => m.id !== id)
}
</script>

<template>
  <div class="custom-metrics-builder">
    <div class="builder-header">
      <span class="title">Custom Metrics</span>
    </div>

    <div class="builder-form">
      <div class="form-row">
        <label class="form-label">Name</label>
        <input
          v-model="metricName"
          class="form-input"
          type="text"
          placeholder="e.g. Node Ratio"
          @keydown.enter="addMetric"
        />
      </div>

      <div class="form-row">
        <label class="form-label">Formula</label>
        <input
          v-model="formula"
          class="form-input mono"
          type="text"
          placeholder="e.g. places + transitions"
          @keydown.enter="addMetric"
        />
      </div>

      <div class="variables-hint">
        Variables:
        <code v-for="v in KNOWN_VARIABLES" :key="v" class="var-tag">{{ v }}</code>
        &nbsp; Operators: <code class="var-tag">+ - * / ( )</code>
      </div>

      <div v-if="formula.trim() && formulaPreview" class="formula-preview">
        <template v-if="formulaPreview.error">
          <span class="preview-error">{{ formulaPreview.error }}</span>
        </template>
        <template v-else>
          <span class="preview-label">Result:</span>
          <span class="preview-value">{{ typeof formulaPreview.value === 'number' ? Number(formulaPreview.value.toFixed(4)) : formulaPreview.value }}</span>
        </template>
      </div>

      <div class="threshold-row">
        <label class="form-label">Thresholds (optional)</label>
        <div class="threshold-inputs">
          <div class="threshold-field">
            <span class="threshold-label good">Good ≤</span>
            <input v-model="thresholdGood" class="form-input threshold-input" type="number" placeholder="—" />
          </div>
          <div class="threshold-field">
            <span class="threshold-label warning">Warn ≥</span>
            <input v-model="thresholdWarning" class="form-input threshold-input" type="number" placeholder="—" />
          </div>
          <div class="threshold-field">
            <span class="threshold-label bad">Bad ≥</span>
            <input v-model="thresholdBad" class="form-input threshold-input" type="number" placeholder="—" />
          </div>
        </div>
      </div>

      <div v-if="validationError" class="validation-error">{{ validationError }}</div>

      <button class="btn-add" @click="addMetric">Add Metric</button>
    </div>

    <div v-if="customMetricsWithValues.length" class="metrics-list">
      <div class="list-header">
        <span class="list-title">Defined Metrics</span>
        <span class="list-count">({{ customMetricsWithValues.length }})</span>
      </div>
      <div
        v-for="metric in customMetricsWithValues"
        :key="metric.id"
        class="metric-row"
      >
        <div class="metric-main">
          <span class="metric-name">{{ metric.name }}</span>
          <code class="metric-formula">{{ metric.formula }}</code>
        </div>
        <div class="metric-right">
          <span v-if="metric.status" :class="['status-dot', `status-${metric.status}`]" />
          <span
            :class="['metric-value', { 'metric-value-error': typeof metric.currentValue === 'string' }]"
          >
            {{ typeof metric.currentValue === 'number' ? Number(metric.currentValue.toFixed(4)) : metric.currentValue }}
          </span>
          <button class="btn-delete" @click="removeMetric(metric.id)" title="Remove metric">✕</button>
        </div>
      </div>
    </div>

    <div v-else class="empty-state">
      No custom metrics defined yet.
    </div>
  </div>
</template>

<style scoped>
.custom-metrics-builder {
  border: 1px solid var(--color-border);
  border-radius: 6px;
  overflow: hidden;
}

.builder-header {
  display: flex;
  align-items: center;
  padding: 8px 10px;
  background: var(--color-bg);
  border-bottom: 1px solid var(--color-border);
}

.title {
  font-weight: 500;
  color: var(--color-text);
  font-size: 13px;
}

.builder-form {
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-row {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.form-label {
  font-size: 11px;
  font-weight: 500;
  color: var(--color-text-muted);
}

.form-input {
  padding: 5px 8px;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  background: var(--color-bg-secondary);
  color: var(--color-text);
  font-size: 12px;
  outline: none;
}

.form-input:focus {
  border-color: var(--color-primary);
}

.form-input.mono {
  font-family: monospace;
}

.variables-hint {
  font-size: 10px;
  color: var(--color-text-muted);
  line-height: 1.8;
}

.var-tag {
  display: inline-block;
  padding: 0 4px;
  margin: 0 2px;
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: 3px;
  font-size: 10px;
  font-family: monospace;
  color: var(--color-text);
}

.formula-preview {
  padding: 6px 8px;
  background: var(--color-bg-secondary);
  border-radius: 4px;
  font-size: 12px;
}

.preview-label {
  color: var(--color-text-muted);
  margin-right: 6px;
}

.preview-value {
  font-weight: 600;
  font-family: monospace;
  color: var(--color-text);
}

.preview-error {
  color: #ef4444;
  font-size: 11px;
}

.validation-error {
  color: #ef4444;
  font-size: 11px;
  padding: 4px 0;
}

.btn-add {
  align-self: flex-start;
  padding: 5px 14px;
  background: var(--color-primary);
  border: none;
  border-radius: 4px;
  color: #fff;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
}

.btn-add:hover {
  opacity: 0.9;
}

.metrics-list {
  border-top: 1px solid var(--color-border);
}

.list-header {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 10px;
  background: var(--color-bg);
  border-bottom: 1px solid var(--color-border);
}

.list-title {
  font-weight: 500;
  font-size: 12px;
  color: var(--color-text);
}

.list-count {
  font-size: 11px;
  color: var(--color-text-muted);
}

.metric-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 10px;
  border-bottom: 1px solid var(--color-border);
}

.metric-row:last-child {
  border-bottom: none;
}

.metric-main {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.metric-name {
  font-size: 12px;
  font-weight: 500;
  color: var(--color-text);
}

.metric-formula {
  font-size: 10px;
  font-family: monospace;
  color: var(--color-text-muted);
}

.metric-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.metric-value {
  font-size: 12px;
  font-weight: 600;
  font-family: monospace;
  color: var(--color-text);
}

.metric-value-error {
  color: #ef4444;
  font-size: 10px;
  font-weight: 400;
}

.btn-delete {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  color: var(--color-text-muted);
  font-size: 10px;
  cursor: pointer;
}

.btn-delete:hover {
  background: #fee2e2;
  border-color: #ef4444;
  color: #991b1b;
}

:global(.dark) .btn-delete:hover {
  background: rgba(239, 68, 68, 0.2);
  color: #f87171;
}

.threshold-row {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.threshold-inputs {
  display: flex;
  gap: 6px;
}

.threshold-field {
  display: flex;
  align-items: center;
  gap: 4px;
  flex: 1;
}

.threshold-label {
  font-size: 10px;
  font-weight: 600;
  white-space: nowrap;
}

.threshold-label.good {
  color: #16a34a;
}

.threshold-label.warning {
  color: #d97706;
}

.threshold-label.bad {
  color: #dc2626;
}

.threshold-input {
  width: 100%;
  min-width: 0;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.status-good {
  background: #22c55e;
}

.status-warning {
  background: #f59e0b;
}

.status-bad {
  background: #ef4444;
}

.empty-state {
  padding: 20px;
  text-align: center;
  color: var(--color-text-muted);
  font-size: 12px;
}
</style>
