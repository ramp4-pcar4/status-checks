import { getExecOutput } from '@actions/exec'
import { notice, warning } from '@actions/core'
import type { ActionInterface, PrettierResults } from './constants.js'

export async function run(action: ActionInterface): Promise<PrettierResults> {
  const result = await getExecOutput(action.inputs.formatCommand, [], {
    ignoreReturnCode: true,
    silent: true,
    cwd: action.inputs.path
  })

  const regex = /\[(warn|error)\]/gm
  let m
  let output: PrettierResults = { failed: false }

  if ((m = regex.exec(result.stdout)) !== null) {
    output.failed = true
    warning('Prettier check failed!')
  } else {
    notice(`Prettier check has passed!`)
    output.failed = false
  }
  return output
}
