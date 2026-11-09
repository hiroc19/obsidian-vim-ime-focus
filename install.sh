#!/bin/sh
# Link this plugin into an Obsidian vault's .obsidian/plugins directory.
# Usage: ./install.sh <vault-path>
set -eu

PLUGIN_ID="hiroc-vim-ime-focus"

if [ "$#" -ne 1 ]; then
  echo "usage: $0 <vault-path>" >&2
  exit 2
fi

repo_dir=$(cd "$(dirname "$0")" && pwd -P)
vault_dir=$(cd "$1" && pwd -P)

if [ ! -d "$vault_dir/.obsidian" ]; then
  echo "error: $vault_dir/.obsidian not found (open the vault in Obsidian once first)" >&2
  exit 1
fi

plugins_dir="$vault_dir/.obsidian/plugins"
target="$plugins_dir/$PLUGIN_ID"
mkdir -p "$plugins_dir"

# Relative link so a vault synced through git works on other Macs with the
# same ghq layout. perl ships with macOS.
link_value=$(perl -MFile::Spec -e 'print File::Spec->abs2rel($ARGV[0], $ARGV[1])' "$repo_dir" "$plugins_dir")

if [ -L "$target" ]; then
  if [ "$(readlink "$target")" = "$link_value" ]; then
    echo "already linked: $target -> $link_value"
  else
    echo "error: $target is a symlink to $(readlink "$target"); remove it first" >&2
    exit 1
  fi
elif [ -e "$target" ]; then
  echo "error: $target already exists; remove or move it first" >&2
  exit 1
else
  ln -s "$link_value" "$target"
  echo "linked: $target -> $link_value"
fi

# Register the plugin as enabled. Obsidian reads this list only at startup.
# JXA (osascript) is used because macOS ships no standalone JSON editor.
enable_result=$(osascript -l JavaScript - "$vault_dir/.obsidian/community-plugins.json" "$PLUGIN_ID" <<'JXA'
function run(argv) {
  const [file, id] = argv;
  let list = [];
  if ($.NSFileManager.defaultManager.fileExistsAtPath(file)) {
    const text = $.NSString.stringWithContentsOfFileEncodingError(file, $.NSUTF8StringEncoding, null).js;
    list = JSON.parse(text);
  }
  if (list.includes(id)) return "already enabled";
  list.push(id);
  $(JSON.stringify(list, null, 2)).writeToFileAtomicallyEncodingError(file, true, $.NSUTF8StringEncoding, null);
  return "enabled";
}
JXA
)
echo "community-plugins.json: $enable_result"

im_select_found=""
for candidate in \
  /opt/homebrew/bin/im-select \
  /usr/local/bin/im-select \
  "$HOME/.nix-profile/bin/im-select" \
  "/etc/profiles/per-user/$(id -un)/bin/im-select" \
  /run/current-system/sw/bin/im-select; do
  if [ -x "$candidate" ]; then
    im_select_found="$candidate"
    break
  fi
done

if [ -z "$im_select_found" ]; then
  echo "warning: im-select not found. Install it: brew install daipeihust/tap/im-select" >&2
fi

cat <<'EOF'

Next steps:
  1. Quit Obsidian completely (Cmd+Q) and reopen the vault.
     A running Obsidian does not pick up new plugin folders.
  2. If Settings > Community plugins shows "Turn on community plugins"
     (restricted mode), turn it on.
  3. Confirm "Hiroc Vim IME Focus" is listed and enabled.
EOF
