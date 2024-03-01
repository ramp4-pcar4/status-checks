import { run as tsRun } from './ts-check.js'
import { run as lintRun } from './lint-check.js'
import { run as prettierRun } from './prettier-check.js'
import { DefaultArtifactClient } from '@actions/artifact'
import { warning, setFailed, setOutput } from '@actions/core'
import fs from 'fs'
import { findAndExtractArtifact, results } from './lib.js'
import { createAction } from './constants.js'

const action = createAction()
const artifactClient = new DefaultArtifactClient()

try {
  action.previousResults = await findAndExtractArtifact(action)
} catch {
  warning('The head branch is missing status data, cannot compare this PR.')
}

// Run everything in parallel
const tsR = tsRun(action)
const lintR = lintRun(action)
const prettierR = prettierRun(action)
const tsResults = await tsR
const lintResults = await lintR
const prettierResults = await prettierR

results.ts.errors = tsResults.errors
results.lint = lintResults
results.prettierWarning = prettierResults.failed

fs.writeFileSync('status-results.json', JSON.stringify(results))
await artifactClient.uploadArtifact(action.sha, ['status-results.json'], '.')

setOutput('ts-errors', results.ts.errors)
setOutput('lint-errors', results.lint.errors)
setOutput('lint-warnings', results.lint.warnings)
setOutput('format-status', results.prettierWarning)

if (tsResults.failed || lintResults.failed || prettierResults.failed) {
  setFailed(
    `One or more checks failed. Please check the annotations for more details.`
  )
}
