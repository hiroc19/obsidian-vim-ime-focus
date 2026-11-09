# Hiroc Vim IME Focus

Obsidian の Vim モードに合わせて macOS の入力ソースを自動で切り替えるデスクトップ専用プラグイン。

- Normal・Visual モードに入ると `com.apple.keylayout.ABC`（英字）へ切り替える
- Insert・Replace モードに入ると、直前に使っていた入力ソース（日本語 IME など）へ戻す
- ウィンドウのフォーカス、タブの切り替え、ファイルを開いたときにも、Normal モードなら英字へ揃える

## 必要なもの

- macOS 版の Obsidian で、Vim キーバインドを有効にしていること
- [`im-select`](https://github.com/daipeihust/im-select)

  ```bash
  brew install daipeihust/tap/im-select
  ```

  `/opt/homebrew/bin`、`/usr/local/bin`、`~/.nix-profile/bin`、`/etc/profiles/per-user/$USER/bin`、`/run/current-system/sw/bin` の順に探す。
- 入力ソースに「ABC」が追加されていること

## インストール

```bash
ghq get hiroc19/obsidian-vim-ime-focus
~/ghq/github.com/hiroc19/obsidian-vim-ime-focus/install.sh <Vaultのパス>
```

`install.sh` は Vault の `.obsidian/plugins/hiroc-vim-ime-focus` に、このリポジトリへの相対 symlink を作る。既存のファイルやディレクトリは上書きしない。

その後、Obsidian の「設定」→「コミュニティプラグイン」で `Hiroc Vim IME Focus` を有効にする。

## 更新

```bash
git -C ~/ghq/github.com/hiroc19/obsidian-vim-ime-focus pull
```

更新した内容は、Obsidian を再起動するか、プラグインを一度無効にしてから有効にし直すと反映される。

## トラブルシューティング

開発者ツール（`⌘⌥I`）のコンソールに出る `[hiroc-vim-ime-focus]` のエラーを確認する。`im-select not found` と出ている場合は、`im-select` をインストールしてからプラグインを再読み込みする。
