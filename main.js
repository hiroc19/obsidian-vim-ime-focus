const { MarkdownView, Plugin } = require("obsidian");
const { execFile } = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");

const PLUGIN_ID = "hiroc-vim-ime-focus";
const COMMAND_INPUT_SOURCE = "com.apple.keylayout.ABC";

// GUI apps do not inherit the login shell PATH, so probe the usual install
// locations (Apple Silicon Homebrew, Intel Homebrew, Nix profiles).
function findImSelect() {
  const user = os.userInfo().username;
  const candidates = [
    "/opt/homebrew/bin/im-select",
    "/usr/local/bin/im-select",
    path.join(os.homedir(), ".nix-profile/bin/im-select"),
    `/etc/profiles/per-user/${user}/bin/im-select`,
    "/run/current-system/sw/bin/im-select",
  ];
  return candidates.find((candidate) => fs.existsSync(candidate)) ?? null;
}

module.exports = class HirocVimImeFocusPlugin extends Plugin {
  async onload() {
    this.imSelectPath = findImSelect();
    if (!this.imSelectPath) {
      console.error(`[${PLUGIN_ID}] im-select not found; input source sync disabled`);
      return;
    }

    this.editorModes = new WeakMap();
    this.attachedEditors = new Set();
    this.registeredWindows = new WeakSet();
    this.restoreInputSource = "";
    this.operation = Promise.resolve();

    this.registerWindow(window);
    this.registerEvent(
      this.app.workspace.on("window-open", (_workspaceWindow, win) => {
        this.registerWindow(win);
      }),
    );
    this.registerEvent(
      this.app.workspace.on("active-leaf-change", () => {
        this.syncActiveEditor(false);
      }),
    );
    this.registerEvent(
      this.app.workspace.on("file-open", () => {
        this.syncActiveEditor(false);
      }),
    );
    this.app.workspace.onLayoutReady(() => {
      this.syncActiveEditor(document.hasFocus());
    });
  }

  onunload() {
    if (!this.attachedEditors) {
      return;
    }
    for (const { editor, handler } of this.attachedEditors) {
      editor.off("vim-mode-change", handler);
    }
    this.attachedEditors.clear();
  }

  registerWindow(win) {
    if (!win || this.registeredWindows.has(win)) {
      return;
    }

    this.registeredWindows.add(win);
    this.registerDomEvent(win, "focus", () => {
      this.syncActiveEditor(true);
    });
  }

  syncActiveEditor(captureRestoreSource) {
    const editor = this.getActiveCodeMirror();
    if (!editor) {
      return;
    }

    this.attachEditor(editor);
    const mode = this.readMode(editor);
    this.editorModes.set(editor, mode);

    if (this.isCommandMode(mode)) {
      this.enqueueInputSourceChange(captureRestoreSource);
    }
  }

  attachEditor(editor) {
    for (const entry of this.attachedEditors) {
      if (entry.editor === editor) {
        return;
      }
    }

    const handler = (modeObject) => {
      const previousMode = this.readMode(editor);
      const mode = modeObject?.mode ?? this.readMode(editor);
      this.editorModes.set(editor, mode);

      if (this.isCommandMode(mode)) {
        this.enqueueInputSourceChange(!this.isCommandMode(previousMode));
      } else {
        this.enqueueRestoreInputSource();
      }
    };

    editor.on("vim-mode-change", handler);
    this.attachedEditors.add({ editor, handler });
  }

  readMode(editor) {
    const knownMode = this.editorModes.get(editor);
    if (knownMode) {
      return knownMode;
    }

    const vimState = editor?.state?.vim;
    if (vimState?.insertMode) {
      return "insert";
    }
    if (vimState?.visualMode) {
      return "visual";
    }
    return "normal";
  }

  isCommandMode(mode) {
    return mode !== "insert" && mode !== "replace";
  }

  getActiveCodeMirror() {
    const view = this.app.workspace.getActiveViewOfType(MarkdownView);
    return view?.editMode?.editor?.cm?.cm ?? null;
  }

  enqueueInputSourceChange(captureRestoreSource) {
    this.enqueue(async () => {
      const currentInputSource = await this.getCurrentInputSource();
      if (!currentInputSource) {
        return;
      }

      if (captureRestoreSource) {
        this.restoreInputSource =
          currentInputSource === COMMAND_INPUT_SOURCE ? "" : currentInputSource;
      }

      if (currentInputSource !== COMMAND_INPUT_SOURCE) {
        await this.setInputSource(COMMAND_INPUT_SOURCE);
      }
    });
  }

  enqueueRestoreInputSource() {
    this.enqueue(async () => {
      if (!this.restoreInputSource) {
        return;
      }

      const currentInputSource = await this.getCurrentInputSource();
      if (currentInputSource !== this.restoreInputSource) {
        await this.setInputSource(this.restoreInputSource);
      }
    });
  }

  enqueue(operation) {
    this.operation = this.operation
      .then(operation)
      .catch((error) => console.error(`[${PLUGIN_ID}]`, error));
  }

  getCurrentInputSource() {
    return this.runImSelect([]).then((stdout) => stdout.trim());
  }

  setInputSource(inputSource) {
    return this.runImSelect([inputSource]);
  }

  runImSelect(args) {
    return new Promise((resolve, reject) => {
      execFile(this.imSelectPath, args, { encoding: "utf8" }, (error, stdout, stderr) => {
        if (error) {
          reject(
            new Error(
              `im-select failed: ${stderr.trim() || error.message}`,
            ),
          );
          return;
        }
        resolve(stdout ?? "");
      });
    });
  }
};
