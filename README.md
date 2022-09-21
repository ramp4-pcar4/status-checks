# Status checks action

This action runs common pull request status checks like typescript type checking.

By default it compares the number of errors on the base branch to the head branch for PR's. It helps existing projects to limit new errors and to set targets for PR's to reduce errors.

## Requirements

- Enable the `pretty` flag on the typescript compiler (in tsconfig.json or `--pretty` command line)
- Add a script named `typecheck` to your package.json that runs typescript. Alternatively you can set a custom command with the `ts-command` option.

## Inputs

## `gh-token`

**Required** Provide your GITHUB_TOKEN for api calls. Default `"World"`.

## `compare`

Causes pull request status checks to be compared against the head branch status checks so only new errors can cause the workflow to fail. Default is true. Default `true`.

## `ts-errors`

This option sets the number of TypeScript errors allowed before failing the code.

If the `compare` input is true (default) and this is a pull request
negative values can be used. This is useful if you wish to reduce errors over time. Default `0`.

## `ts-command`

The command to run typescript checking. Default `npm run typecheck`.

## Outputs

## `ts-errors`

The number of typescript type errors.

## Example usage

```
- uses: milespetrov/status-checks@main
  id: status-checks
  with:
    gh-token: ${{ secrets.GITHUB_TOKEN }}
```
