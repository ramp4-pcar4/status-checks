import type {ArtifactClient} from '@actions/artifact'
import {getExecOutput} from '@actions/exec'
import {jest} from '@jest/globals'
import type {ActionInterface} from '../src/constants'
jest.setTimeout(50000)

const context = {
  ref: 'test-branch',
  sha: (await getExecOutput('git rev-parse HEAD')).stdout.trim(),
  payload: {
    pull_request: {
      base: {
        sha: (await getExecOutput('git rev-parse origin/main')).stdout.trim(),
        repo: {
          name: 'status-checks'
        },
        user: {
          login: 'milespetrov'
        }
      },
      head: {
        ref: 'test-branch',
        sha: (await getExecOutput('git rev-parse HEAD')).stdout.trim()
      }
    }
  }
}

const originalGithub = await import('@actions/github')
const originalCore = await import('@actions/core')
const originalLib = await import('../src/lib.js')
jest.unstable_mockModule('@actions/github', () => {
  return {
    __esModule: true,
    ...originalGithub,
    context
  }
})

jest.unstable_mockModule('@actions/core', () => {
  return {
    __esModule: true,
    ...originalCore,
    setFailed: jest.fn()
  }
})

jest.unstable_mockModule('../src/lib.ts', () => {
  return {
    __esModule: true,
    ...originalLib,
    findAndExtractArtifact: jest.fn((action: ActionInterface) => {
      console.error(action)
      return {errors: action._tests?.originErrors || 0, files: 0}
    })
  }
})

jest.unstable_mockModule('@actions/artifact', () => {
  return {
    __esModule: true,
    default: {
      create: jest.fn(() => ({
        uploadArtifact: jest.fn(() => new Promise(r => r(true)))
      }))
    }
  }
})

let artifactClient, run, core

const action = await import('../src/constants').then(m => m.createAction())
const originalAction = JSON.stringify(action)
const originalContext = JSON.stringify(context)

describe('TypeScript', () => {
  beforeEach(async () => {
    await import('../src/ts-check').then(m => {
      artifactClient = m.artifactClient
      run = m.run
    })
    await import('@actions/core').then(m => {
      core = m
    })
    jest.resetModules()
    jest.clearAllMocks()
  })

  afterEach(() => {
    Object.assign(action, JSON.parse(originalAction))
    Object.assign(context, JSON.parse(originalContext))
  })

  it('should pass if there are no errors', async () => {
    const results = await run(action)
    expect(core.setFailed).toBeCalledTimes(0)
    expect(results.errors).toBe(0)
    //@ts-ignore
    expect(artifactClient.uploadArtifact.mock.calls[0][0]).toBe(context.sha)
    expect(artifactClient.uploadArtifact).toBeCalledTimes(1)
  })

  it('should fail if there are more errors than number provided', async () => {
    Object.assign(action.inputs, {
      tsCommand: 'yarn run tsc ./src/bad-file.ts --noEmit --pretty'
    })
    await run(action)
    expect(core.setFailed).toBeCalledTimes(1)
  })

  it('should not fail if there are less errors than origin', async () => {
    Object.assign(action, {
      _tests: {
        originErrors: 1
      }
    })
    await run(action)

    expect(core.setFailed).toBeCalledTimes(0)
  })

  it('should fail if there should be less errors than origin', async () => {
    Object.assign(action, {
      inputs: {
        ...action.inputs,
        tsCommand: 'yarn run tsc ./src/bad-file.ts --noEmit --pretty',
        tsErrors: -1
      },
      _tests: {
        originErrors: 1
      }
    })
    await run(action)

    expect(core.setFailed).toBeCalledTimes(1)
  })

  it('should not fail if compare is false and origin has less errors', async () => {
    Object.assign(action, {
      inputs: {
        ...action.inputs,
        tsCommand: 'yarn run tsc ./src/bad-file.ts --noEmit --pretty',
        compare: false,
        tsErrors: 1
      },
      _tests: {
        originErrors: 5
      }
    })
    await run(action)

    expect(core.setFailed).toBeCalledTimes(0)
  })
})
