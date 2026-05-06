<!--
Thanks for contributing to @maamria/awb. Please fill in the sections that apply
and remove the ones that don't. Short and clear beats long and exhaustive.
-->

## Summary

<!-- What does this PR change and why? 1–3 sentences. -->

## Type of change

- [ ] Bug fix (non-breaking)
- [ ] New feature (non-breaking)
- [ ] Breaking change (existing CLI behaviour changes)
- [ ] Documentation only
- [ ] Refactor / internal cleanup
- [ ] CI / tooling
- [ ] Security fix

## Checklist

- [ ] `npm run build` passes (`tsc` clean).
- [ ] I ran the affected commands manually (`./bin/dev.sh status`, `init`, …) and they behave as expected.
- [ ] I added or updated docs in [`docs/`](../docs) where the change is user-visible.
- [ ] I added an entry under `## [Unreleased]` in [`CHANGELOG.md`](../CHANGELOG.md).
- [ ] I removed any debug logs / `console.log` calls.
- [ ] No secrets, tokens, or `.env` content in the diff or in commit messages.

## Testing

<!--
How did you verify this works? Reviewers shouldn't have to guess.
Examples:
- `./bin/dev.sh init` in a throwaway directory; produced files X, Y, Z.
- `maamria-awb status` against local + prod; both return correct identity.
- Backend at http://127.0.0.1:8010/v1; verified <endpoint> returns shape Z.
-->

## Documentation updates

<!-- Which docs were touched, or why none were necessary. -->

- [ ] `README.md`
- [ ] `docs/commands.md`
- [ ] `docs/api-contract.md`
- [ ] `docs/config.md`
- [ ] `docs/security.md`
- [ ] `docs/architecture.md`
- [ ] `CHANGELOG.md`
- [ ] No doc changes needed (explain why):

## Security considerations

<!--
Does this PR change anything that touches credentials, network calls, file
writing, or generated artefacts? If yes, briefly describe the risk and how
you mitigated it. If no, write "Not applicable".
-->

## Related issues

<!-- Closes #123 / Refs #456 -->
