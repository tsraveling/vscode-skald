import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";
import { workspace, window, ExtensionContext } from "vscode";
import {
  LanguageClient,
  LanguageClientOptions,
  ServerOptions,
} from "vscode-languageclient/node";

let client: LanguageClient | undefined;

const outputChannel = window.createOutputChannel("Skald LSP");

/**
 * Resolve the server binary path. If the configured path is already absolute
 * and exists, use it directly. Otherwise, ask a login shell to resolve it so
 * we pick up the user's full $PATH (which the VSCode extension host doesn't
 * inherit on macOS).
 */
function resolveServerPath(configured: string): string | undefined {
  // Absolute path provided — just check it exists.
  if (path.isAbsolute(configured)) {
    return fs.existsSync(configured) ? configured : undefined;
  }

  // Try the extension host's PATH first (works when VSCode is launched from a
  // terminal, or on Linux where the PATH is usually inherited correctly).
  try {
    const found = execSync(`which ${configured}`, { encoding: "utf-8" }).trim();
    if (found) return found;
  } catch {
    // `which` exits non-zero when the command isn't found — that's fine.
  }

  // Fall back to a login shell so we get the user's full PATH.
  const shell = process.env.SHELL || "/bin/zsh";
  try {
    const found = execSync(`${shell} -lc "which ${configured}"`, {
      encoding: "utf-8",
    }).trim();
    if (found) return found;
  } catch {
    // Not found even with login shell PATH.
  }

  return undefined;
}

export function activate(context: ExtensionContext) {
  const config = workspace.getConfiguration("skald");
  const configured = config.get<string>("lsp.path", "skald_lsp");

  const serverPath = resolveServerPath(configured);

  if (!serverPath) {
    const msg =
      `Skald LSP: could not find "${configured}". ` +
      `Set an absolute path in Settings → skald.lsp.path, or make sure ` +
      `the binary is on your PATH.`;
    window.showErrorMessage(msg);
    outputChannel.appendLine(msg);
    return;
  }

  outputChannel.appendLine(`Skald LSP: using server binary at ${serverPath}`);

  const serverOptions: ServerOptions = {
    command: serverPath,
    args: [],
  };

  const clientOptions: LanguageClientOptions = {
    documentSelector: [{ scheme: "file", language: "skald" }],
    synchronize: {
      fileEvents: workspace.createFileSystemWatcher("**/*.ska"),
    },
    outputChannel,
  };

  client = new LanguageClient(
    "skaldLsp",
    "Skald Language Server",
    serverOptions,
    clientOptions
  );

  client.start().catch((err) => {
    const msg = `Skald LSP: failed to start — ${err}`;
    window.showErrorMessage(msg);
    outputChannel.appendLine(msg);
  });
}

export function deactivate(): Thenable<void> | undefined {
  if (!client) {
    return undefined;
  }
  return client.stop();
}
