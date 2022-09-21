import {getInput} from '@actions/core'
import {context, getOctokit} from '@actions/github'
import {isNullOrUndefined} from './lib.js'
const ghToken = getInput('gh-token') || process.env.GH_TOKEN || ''

export interface TypeScriptResults {
  /** The number of TypeScript errors */
  errors: number
  /** The number of files with errors */
  files: number
}

export interface ActionInterface {
  octokit: ReturnType<typeof getOctokit>
  inputs: {
    compare: boolean
    tsErrors: number
    tsCommand: string
  }
  isPR: boolean
  ref: string
  sha: string
  baseSha: string
  baseRepo: string
  baseOwner: string
  _tests?: {
    originErrors?: number
  }
}
export const createAction: () => ActionInterface = () => ({
  octokit: getOctokit(ghToken),
  inputs: {
    compare: !isNullOrUndefined(getInput('compare'))
      ? getInput('compare').toLowerCase() === 'true'
      : true,
    tsErrors: !isNullOrUndefined(getInput('ts-errors'))
      ? Number.parseInt(getInput('ts-errors'))
      : 0,
    tsCommand: !isNullOrUndefined(getInput('ts-command'))
      ? getInput('ts-command')
      : 'npm run typecheck'
  },
  isPR: !!context.payload.pull_request,
  ref: context.payload.pull_request
    ? context.payload.pull_request.head.ref
    : context.ref,
  sha: context.payload.pull_request
    ? context.payload.pull_request.head.sha
    : context.sha,
  baseSha: context.payload.pull_request
    ? context.payload.pull_request.base.sha
    : '',
  baseRepo: context.payload.pull_request
    ? context.payload.pull_request.base.repo.name
    : '',
  baseOwner: context.payload.pull_request
    ? context.payload.pull_request.base.user.login
    : ''
})

export type Octokit = ReturnType<typeof getOctokit>
