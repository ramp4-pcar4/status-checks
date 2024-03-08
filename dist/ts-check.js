import exec from '@actions/exec';
import { info, warning, startGroup, endGroup, notice } from '@actions/core';
export async function run(action) {
    const results = await tsCheck(action.inputs.tsCommand);
    let errorCount = results.errors;
    if (action.inputs.compare) {
        errorCount = await compareErrors(errorCount, action);
    }
    info(`Error count: ${errorCount} \n Action Errors: ${action.inputs.tsErrors}`);
    if (errorCount > action.inputs.tsErrors) {
        results.failed = true;
        warning('TypeScript check failed!');
    }
    else {
        results.failed = false;
        notice(`Typescript check has passed!`);
    }
    return results;
}
async function compareErrors(errorCount, action) {
    if (action.previousResults) {
        info(`Previous errors: ${action.previousResults.ts.errors}`);
        return errorCount - action.previousResults.ts.errors;
    }
    return errorCount;
}
async function tsCheck(command) {
    const result = await exec.getExecOutput(command, [], {
        ignoreReturnCode: true
    });
    startGroup('TypeScript Output');
    console.log(result.stdout);
    console.log(result.stderr);
    endGroup();
    const regex = /Found (\d+) errors?.*?(?:in (\d+)? files?|in (.*):(\d+))/gm;
    let m = regex.exec(result.stdout + result.stderr);
    let output = { errors: 0, files: 0, failed: false };
    if (m) {
        output.failed = true;
        output.errors = parseInt(m[1]);
        output.files =
            (parseInt(m[2]) || 0) + (parseInt(m[3]) || 0) + (parseInt(m[4]) || 0);
    }
    return output;
}
