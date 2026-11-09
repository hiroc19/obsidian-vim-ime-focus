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

1. `im-select` をインストールする（上記）。
2. Obsidian を `⌘Q` で完全に終了する。
   起動中の Obsidian は新しく追加されたプラグインを読み込まない。また、終了するときに有効化設定を上書きすることがある。
3. リポジトリを取得して、対象の Vault へ導入する。

   ```bash
   ghq get hiroc19/obsidian-vim-ime-focus
   ~/ghq/github.com/hiroc19/obsidian-vim-ime-focus/install.sh <Vaultのパス>
   ```

   `install.sh` は次の 2 つを行う。何度実行しても結果は同じで、既存のファイルやディレクトリは上書きしない。
   - `.obsidian/plugins/hiroc-vim-ime-focus` に、このリポジトリへの相対 symlink を作る
   - `.obsidian/community-plugins.json` にプラグイン ID を追加して有効にする
4. Obsidian で Vault を開く。
5. 「設定」→「コミュニティプラグイン」に「コミュニティプラグインを有効化」ボタンが出ている場合は、制限モードなので有効化する。新しい端末で初めて開いた Vault はこの状態になっている。
6. インストール済みプラグインの一覧に `Hiroc Vim IME Focus` があり、有効になっていることを確認する。

### Vault を git で同期している場合

`.obsidian/plugins/hiroc-vim-ime-focus` の symlink と `community-plugins.json` をコミットしておけば、他の端末では Vault を clone して `ghq get hiroc19/obsidian-vim-ime-focus` を実行するだけで済む（手順 3 の `install.sh` は不要）。symlink は相対パスなので、Vault とこのリポジトリが ghq の同じオーナーディレクトリ（`~/ghq/github.com/hiroc19/`）にあることが前提。

## 更新

```bash
git -C ~/ghq/github.com/hiroc19/obsidian-vim-ime-focus pull
```

更新した内容は、Obsidian を再起動するか、プラグインを一度無効にしてから有効にし直すと反映される。

## トラブルシューティング

- 一覧にプラグインが出てこない: Obsidian を完全に終了して起動し直したか、制限モードがオフになっているかを確認する。`ls -l <Vault>/.obsidian/plugins/hiroc-vim-ime-focus/` で `main.js` が見えなければ、symlink の先が存在しない。
- 一覧には出るが IME が切り替わらない: 下記のコンソールを確認する。

開発者ツール（`⌘⌥I`）のコンソールに出る `[hiroc-vim-ime-focus]` のエラーを確認する。`im-select not found` と出ている場合は、`im-select` をインストールしてからプラグインを再読み込みする。
