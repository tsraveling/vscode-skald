# vscode-skald
A VSCode plugin for the Skald narrative language scripting system.

## Local Development

### First Install

```bash
cd ~/repos/vscode-skald
npm install
npm run deploy
```

Reload VS Code after installing. Open any `.ska` file to verify highlighting works.

### Reinstalling After Changes

```bash
npm run deploy
```

Reload VS Code to pick up the new version.

### Grammar-Only Changes

If you only changed `.tmLanguage.json` or `language-configuration.json` (no TypeScript), you can skip compilation:

```bash
npm run package
code --install-extension vscode-skald.vsix
```

### LSP Binary

The extension expects a `skald_lsp` binary. By default it looks for `skald_lsp` on your `$PATH`. You can override this in VS Code settings:

```json
{ "skald.lsp.path": "/path/to/skald/build/skald_lsp" }
```

To build it from the core Skald repo:

```bash
cd ~/repos/skald
cmake -B build -DSKALD_BUILD_LSP=ON
cmake --build build --target skald_lsp
```

This produces `build/skald_lsp`. Either point the setting at it directly, or symlink/copy it somewhere on your `$PATH`:

```bash
ln -sf ~/repos/skald/build/skald_lsp /usr/local/bin/skald_lsp
```

The binary is self-contained -- no runtime dependencies on the Skald repo. Rebuild it after pulling changes to the core repo and reload VS Code to pick up the new binary.
