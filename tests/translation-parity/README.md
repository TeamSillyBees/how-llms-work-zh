# Translation parity (real Chromium)

GitHub Actions checks the Chinese PR against locked upstream commit
`1add5a7225cfa1292d5641b7d8e65bbd05beb8fd` in a second read-only checkout.
The workflow has only `contents: read`, no credentials, publishing, deployment,
secrets, or paid API calls. Playwright 1.64.1 and TypeScript 6.0.3 match the
pre-existing local QA tool versions and are pinned exactly.

The runner:

- Asserts byte-identical CSS, identical HTML element structure and non-language
  attributes (only lang/aria-label/title/alt/placeholder may vary).
- Asserts identical JavaScript AST leaf token kinds and non-string token values.
  Writes every changed string/template fragment to per-page audit JSON. This
  is **not** a semantic equivalence proof: audit these display literals too.
- Launches runner-installed Google Chrome (Chromium) **with sandboxing enabled**, using local HTTP servers
  only inside CI. No sandbox-disabling flag or workaround is used.
- Captures all three English and Chinese pages at 1440×1000 and 390×844, with
  actual canvas rendering, seeded random values and real scroll/intersection
  callbacks. Waits for fonts; any external font load failures are reported.
- Exercises BPE, sampling, temperature, transformer layers, RAG, thinking,
  research, code/chart, agent loop, neuron sliders, forward propagation,
  loss descent and backpropagation. Compares the two language versions' outputs.
- Checks page/runtime errors, anchors and introduced horizontal overflow.
- Records the upstream RAG in-flight reset bug without fixing it or requiring
  it to pass as a new feature.

Artifacts contain 12 full-page screenshots (if all pages render), report.json,
summary.md and three literal-audit JSON files. **A green run alone is not a
human visual review.** Inspect screenshots for clipping/overlap and compare the
layout design, allowing translated text to wrap differently. No pixel equality
between languages is asserted. This suite is not exhaustive browser coverage.

The script has been syntax-checked locally only: restricted local browser/server
launches were not retried. CI is the real-browser execution environment.

Run in an otherwise supported environment:

```sh
npm install --ignore-scripts --no-audit --no-fund --package-lock=false
npx playwright install-deps chromium
# Requires an existing supported Google Chrome stable installation.
google-chrome --version
SITE_ROOT=/path/to/chinese UPSTREAM_ROOT=/path/to/locked-upstream npm test
```

## Ubuntu sandbox compatibility

The workflow pins Ubuntu 24.04 and selects the runner-provided Chrome stable
channel. Ubuntu supplies an AppArmor profile for its normal installation path;
the downloaded Chromium headless shell does not receive that profile. The browser
launch retains `chromiumSandbox: true`. No AppArmor/sysctl/permission changes or
sandbox-disabling flags are used. The report records the actual browser version.

Sources:
- https://chromium.googlesource.com/chromium/src/+/main/docs/security/apparmor-userns-restrictions.md
- https://playwright.dev/docs/browsers#google-chrome--microsoft-edge
- https://github.com/actions/runner-images/blob/main/images/ubuntu/Ubuntu2404-Readme.md
