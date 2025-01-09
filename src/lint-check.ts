import { getExecOutput } from '@actions/exec'
import { info, warning, startGroup, endGroup, notice } from '@actions/core'
import type { ActionInterface, LintResults } from './constants.js'
import { readFileSync } from 'fs'
import { join } from 'path'

export async function run(action: ActionInterface): Promise<LintResults> {
  let results = await lintCheck(action)
  info(`Lint Results: ${results.errors} errors, ${results.warnings} warnings`)

  if (action.inputs.compare) {
    results = await compareOutput(results, action)
  }

  if (
    results.errors > action.inputs.lintErrors ||
    results.warnings > action.inputs.lintWarnings
  ) {
    results.failed = true
    warning('Lint check failed!')
  } else {
    notice(`Lint check has passed!`)
    results.failed = false
  }
  return results
}

async function compareOutput(
  results: LintResults,
  action: ActionInterface
): Promise<LintResults> {
  if (action.previousResults) {
    info(
      `Previous Lint Results: ${action.previousResults.lint.errors} errors, ${action.previousResults.lint.warnings} warnings`
    )
    return {
      errors: results.errors - action.previousResults.lint.errors,
      warnings: results.warnings - action.previousResults.lint.warnings,
      failed: results.failed
    }
  }
  return results
}

async function lintCheck(action: ActionInterface): Promise<LintResults> {
  const result = await getExecOutput(action.inputs.lintCommand, [], {
    ignoreReturnCode: true,
    silent: true,
    cwd: action.inputs.path
  })

  startGroup('Lint Output')
  console.log(result.stdout)
  console.log(result.stderr)
  endGroup()

  let output: LintResults = { errors: 0, warnings: 0, failed: false }

  try {
    const resultFile = JSON.parse(
      readFileSync(join(action.inputs.path, 'results.json'), 'utf8')
    )
    for (const file of resultFile) {
      output.errors += file.errorCount
      output.warnings += file.warningCount
    }
    if (output.errors > 0) {
      output.failed = true
    }
  } catch (error) {
    console.error('Failed to parse ESLint output:', error)
  }

  return output
}
