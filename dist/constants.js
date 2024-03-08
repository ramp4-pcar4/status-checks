import { getInput } from '@actions/core';
import { context, getOctokit } from '@actions/github';
import { isNullOrUndefined } from './lib.js';
const ghToken = getInput('gh-token') || process.env.GH_TOKEN || '';
export const createAction = () => ({
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
            : 'npm run typecheck',
        lintCommand: !isNullOrUndefined(getInput('lint-command'))
            ? getInput('lint-command')
            : 'npm run lintcheck',
        lintErrors: !isNullOrUndefined(getInput('lint-errors'))
            ? Number.parseInt(getInput('lint-errors'))
            : 0,
        lintWarnings: !isNullOrUndefined(getInput('lint-warnings'))
            ? Number.parseInt(getInput('lint-warnings'))
            : 0,
        formatCommand: !isNullOrUndefined(getInput('format-command'))
            ? getInput('format-command')
            : 'npm run formatcheck'
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
        : context.payload.before,
    baseRepo: context.payload.pull_request
        ? context.payload.pull_request.base.repo.name
        : context.payload.repository?.name || '',
    baseOwner: context.payload.pull_request
        ? context.payload.pull_request.base.user.login
        : context.payload.repository?.owner.name || '',
    previousResults: null
});
