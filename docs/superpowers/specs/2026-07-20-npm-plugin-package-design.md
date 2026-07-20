# Their Time npm Plugin Package Design

## Goal

Publish `@kepler-app/their-time-plugin@1.0.0` as an installable Kepler plugin using `@kepler-app/plugin-sdk@1.0.0`.

## Package contract

The npm package contains only the production plugin bundle under `dist/`:

- `dist/index.js` is the JavaScriptCore-compatible IIFE entry point.
- `dist/manifest.json` is the Kepler plugin manifest generated from the source metadata.

`package.json` advertises the package as a Kepler plugin with the `kepler-plugin` keyword and a versioned locator block:

```json
{
  "kepler": {
    "apiVersion": 1,
    "manifest": "dist/manifest.json",
    "entry": "dist/index.js"
  }
}
```

The package name and plugin version remain `@kepler-app/their-time-plugin` and `1.0.0`.

## Build and publication flow

The regular build writes directly to `dist/` through the SDK CLI. A separate local-install script may copy the generated files into Kepler's Application Support directory for development, but npm publication never packages that local destination.

`prepublishOnly` runs typechecking, builds `dist/`, and validates the package contents before npm can publish. The release check confirms that the tarball contains `package.json`, `dist/index.js`, and `dist/manifest.json`, and that the manifest describes Their Time version `1.0.0`.

## SDK compatibility

Their Time moves from SDK `0.9.0` to `1.0.0`. Its source is updated only where the 1.0 types or runtime contract require it. The plugin remains free of Node and DOM runtime dependencies.

No additional SDK runtime API is required. SDK 1.0 already emits the entry and manifest files referenced by the npm metadata. Package discovery and installation belong to the Kepler app. A future SDK release may add a reusable npm-package validator, but that is optional convenience and outside this release.

## Failure handling

Publication stops if typechecking fails, bundling does not emit the required filenames, the manifest is invalid, or the npm tarball omits either artifact. Publishing uses public access because the package is scoped.

## Verification

Before publication:

1. Install or link SDK `1.0.0` and update the lockfile.
2. Run the TypeScript typecheck.
3. Build the production `dist/` bundle.
4. Inspect `dist/manifest.json` and execute a package dry run.
5. Publish publicly and confirm npm reports version `1.0.0`.
