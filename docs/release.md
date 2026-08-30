# Release process

A source candidate is not a published release. A tag workflow validates the tag, creates a GitHub Release, and publishes a verified API image in separate jobs; inspect both GitHub Releases and GHCR after every run.

## Versioning

Concourse uses Semantic Versioning. Prerelease versions use X.Y.Z-alpha.N, X.Y.Z-beta.N, or X.Y.Z-rc.N. Tags matching v* publish a versioned ghcr.io/<owner>/<repo>/bff image; stable versions also move latest. Do not reuse or move published tags.

The root manifest, apps/api, apps/client, packages/contracts, and packages/institutions use the same SemVer. apps/client/app.config.ts uses the numeric X.Y.Z base; EAS manages native build numbers remotely.

## Prepare a candidate

1. Update the five package versions and the client Expo base version.
2. Add a dated non-empty CHANGELOG.md section for the exact version.
3. Run the source gate on the exact commit:

~~~bash
corepack pnpm@9.15.0 install --frozen-lockfile
pnpm release:check -- X.Y.Z-alpha.N
pnpm verify
~~~

4. Review public documentation, the static-demo evidence, and manual native/accessibility evidence when distribution is in scope.
5. Create an annotated tag from the reviewed commit and push it:

~~~bash
git tag -a vX.Y.Z-alpha.N -m "Concourse Campus Kit X.Y.Z-alpha.N"
git push origin vX.Y.Z-alpha.N
~~~

## Publication and recovery

The workflow validates version/changelog identity, runs the source gate, builds and health-smoke-tests apps/api/Dockerfile.prod on a non-default port, pushes the image, and creates the GitHub release. It does not build mobile binaries.

If publication is partial, keep the published tag unchanged while investigating. Do not retag it. If a source fix is required, publish the next prerelease or patch version.

## Client distribution

The adopting institution owns the EAS project, bundle/package identifiers, signing, public API URL, store records, and device checks. See [client deployment](deploy/mobile.md). EAS builds are not part of pnpm verify.
