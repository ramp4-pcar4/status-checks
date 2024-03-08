import exec from '@actions/exec';
import { notice, warning } from '@actions/core';
export async function run(action) {
    const result = await exec.getExecOutput(action.inputs.formatCommand, [], {
        ignoreReturnCode: true,
        silent: true
    });
    const regex = /\[(warn|error)\]/gm;
    let m;
    let output = { failed: false };
    if ((m = regex.exec(result.stdout)) !== null) {
        output.failed = true;
        warning('Prettier check failed!');
    }
    else {
        notice(`Prettier check has passed!`);
        output.failed = false;
    }
    return output;
}
