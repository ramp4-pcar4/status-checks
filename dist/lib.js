import download from 'download';
import StreamZip from 'node-stream-zip';
import { info, notice } from '@actions/core';
export const isNullOrUndefined = (value) => typeof value === 'undefined' || value === null || value === '';
export const results = {
    ts: {
        errors: 0
    },
    lint: {
        errors: 0,
        warnings: 0
    },
    prettierWarning: false
};
export async function findAndExtractArtifact(action) {
    info(`Looking for latest upload of ${action.baseSha}`);
    const location = await findLatestArtifact(action.baseSha, action.baseRepo, action.baseOwner, action.octokit);
    if (location) {
        info(`Found ${action.baseSha}. Downloading and extracting...`);
        const stringContents = await downloadAndExtract(location, 'status-results.json', action.baseSha);
        return JSON.parse(stringContents);
    }
    notice(`Did not find any artifacts by name: ${action.baseSha}`);
    return null;
}
// Searches for the latest version of an artifact, unarchives the artifact, streams the contents of the "filename" to a string and returns it
async function findLatestArtifact(artifactName, repo, owner, octokit) {
    // Find latest archive
    const res = await octokit.rest.actions.listArtifactsForRepo({ owner, repo });
    const sorted = res.data.artifacts
        .filter(a => a.name === artifactName)
        // @ts-ignore
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    if (sorted.length) {
        // Find file location
        const { id } = sorted[0];
        const res1 = await octokit.request('GET /repos/{owner}/{repo}/actions/artifacts/{artifact_id}/{archive_format}', {
            owner,
            repo,
            artifact_id: id,
            archive_format: 'zip'
        });
        return res1.url;
    }
    return null;
}
// Writes artifact archive to disk, unarchives and streams contents to a string variable
async function downloadAndExtract(url, filename, artifactName) {
    await download(url, 'tmp');
    const zip = new StreamZip.async({ file: `tmp/${artifactName}.zip` });
    const stm = await zip.stream(filename);
    return await streamToString(stm);
}
function streamToString(stream) {
    const chunks = [];
    return new Promise((resolve, reject) => {
        stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
        stream.on('error', (err) => reject(err));
        stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    });
}
