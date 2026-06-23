# AssetFlow CLI — Launch Release Checklist

Use this checklist to execute the final build, packaging, and release steps for **AssetFlow CLI v1.0.0**.

---

## Pre-Release Steps

- [ ] **1. Sync Codebase & Test Suite**
  Run compilation and test runners locally to verify code correctness:
  ```bash
  npm run build
  npm run test
  ```

- [ ] **2. Verify Linting & Types**
  ```bash
  npm run lint
  ```

---

## Packaging Verification

- [ ] **3. Pack and Verify Tarball**
  Generate the npm publishable tarball:
  ```bash
  npm pack
  ```
  
- [ ] **4. Audit Packed Files**
  Check the contents of the generated `assetflow-cli-1.0.0.tgz` to ensure only correct files are packed:
  ```bash
  tar -tf assetflow-cli-1.0.0.tgz
  ```
  **Verify the following list matches:**
  * Only `dist/` JS & `.d.ts` files are included (excluding `dist/tests`).
  * Main documentation files: `README.md`, `LICENSE`, `CHANGELOG.md`, `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`.
  * `package.json` is packed.
  * **Verify that NO tests, screenshots, fixtures, git configurations, or temporary cache files are packaged.**

---

## Local Verification Test

- [ ] **5. Setup Local Testing Sandbox**
  Create a clean sandbox folder elsewhere and install the packed tarball:
  ```bash
  mkdir test-sandbox && cd test-sandbox
  npm init -y
  npm install ../path/to/assetflow-cli-1.0.0.tgz
  ```

- [ ] **6. Run Verification Commands**
  Test CLI binary commands under npx:
  ```bash
  npx assetflow --help
  npx assetflow --version
  npx assetflow init
  npx assetflow doctor
  ```

---

## GitHub Release & npm Publication

- [ ] **7. Commit Changes & Git Tagging**
  Commit all build-ready cleanups and tag the repository release:
  ```bash
  git add .
  git commit -m "release: v1.0.0"
  git tag v1.0.0
  git push origin main
  git push origin v1.0.0
  ```

- [ ] **8. npm Public Publishing**
  Login to npm registry and publish the package publicly:
  ```bash
  npm login
  npm publish --access public
  ```

- [ ] **9. Clean Up Temporary Tarball**
  ```bash
  rm assetflow-cli-1.0.0.tgz
  ```
