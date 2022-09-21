import exec from '@actions/exec'
import {info, warning, setFailed, setOutput} from '@actions/core'
import artifact from '@actions/artifact'
import fs from 'fs'
import {createAction, TypeScriptResults} from './constants.js'
import {findAndExtractArtifact} from './lib.js'
const RESULT_FILE = 'status-results.json'

export const artifactClient = artifact.create()

export async function run(action = createAction()): Promise<TypeScriptResults> {
  const results = await tsCheck(action.inputs.tsCommand)
  let errorCount = results.errors
  info(`Compare: ${action.inputs.compare} \nPR:${action.isPR}`)
  if (action.inputs.compare && action.isPR) {
    errorCount = await compareErrors(errorCount, action)
  }

  info(`Error count: ${errorCount} \n Action Errors: ${action.inputs.tsErrors}`)
  if (errorCount > action.inputs.tsErrors) {
    setFailed(
      `Too many TypeScript errors! There were ${results.errors} errors but only ${action.inputs.tsErrors} are allowed.`
    )
  } else {
    info(`Typescript check has passed!`)
  }

  fs.writeFileSync(RESULT_FILE, JSON.stringify(results))
  await artifactClient.uploadArtifact(action.sha, [RESULT_FILE], '.')
  setOutput('ts-errors', results.errors)
  return results
}

async function compareErrors(errorCount: number, action): Promise<number> {
  try {
    const results = await findAndExtractArtifact(action)
    return errorCount - results!.errors
  } catch {
    warning('The head branch is missing status data, cannot compare this PR.')
    return errorCount
  }
}

async function tsCheck(command: string): Promise<TypeScriptResults> {
  const result = await exec.getExecOutput(command, [], {
    ignoreReturnCode: true
  })

  const regex = /Found (\d+) errors?( in (\d+) files?)?/gm
  let m
  let output: TypeScriptResults = {errors: 0, files: 0}

  if ((m = regex.exec(result.stdout)) !== null) {
    output.errors = parseInt(m[1])
    output.files = parseInt(m[2])
  }
  return output
}
