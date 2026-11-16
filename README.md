# PUZZLE BOX 🎮

数独・ナンバーゲート・ブロックパズルをまとめた、スマホ・PC両対応の無料Webゲーム集です。ブラウザだけで動作し、ユーザー登録や外部APIは必要ありません。

## 🎲 ゲーム

| ゲーム | 内容 |
|---|---|
| 数独 | 9×9・3段階の難易度・一意解・メモ・ヒント・戻す・クリアタイム |
| ナンバーゲート | 左右の加減乗除ゲートを12回選択し、最終的な数の最大化を目指す |
| ブロックパズル | 8×8のボードに3つのピースを配置し、完成した行・列を消す。コンボ・ベスト記録あり |

**遊び方：** ブロックパズルでは、下のピースを指またはマウスでドラッグし、盤面の配置プレビューが緑になった場所で離すと設置できます。置けない位置は赤く表示されます。指で隠れないよう、スマホではブロックを指より少し上に表示します。ピースを選択して盤面をタップする方法も使えます。どのピースも置けなくなると終了です。数独は数字キー・矢印キー、ナンバーゲートは左右矢印キーにも対応。

## 主な仕様

- iPhone / Android / PC に対応したレスポンシブデザイン
- PWA（ホーム画面追加・初回読み込み後のオフライン利用）
- ローカル保存（localStorage）による途中経過と自己ベストの記録
- サウンドON/OFF（Web Audio API、音声ファイル不要）
- 素材、画像、ゲームロジックを独自実装。外部ライブラリ、外部API、広告、課金、ユーザー追跡なし
- 商用ゲームのロゴ、画像、音声、ソースコードを転用しません。ブロック配置ゲームは一般的なルールに着想を得た独自作品です。

## ローカル起動

> JavaScriptモジュールを使うため、`index.html` を直接 `file://` で開くのではなく、ローカルHTTPサーバーから開いてください。

Pythonがあればプロジェクトフォルダで以下を実行します。

```bash
python -m http.server 8000
```

PCのブラウザで `http://localhost:8000/` にアクセスします。

ロジックの自動テストはNode.js 18以上で実行できます。

```bash
npm test
```

## GitHub Pages で公開する

1. GitHubに **新しいリポジトリ** `pocket-puzzle-arcade` を作成します（Public）。
2. このフォルダの中身をリポジトリのルートにアップロード／pushします。
3. GitHubのリポジトリで **Settings → Pages → Build and deployment** を開きます。
4. Source を **Deploy from a branch**、Branch を **main / (root)** として保存します。
5. 数分後、`https://<ユーザー名>.github.io/pocket-puzzle-arcade/` から利用できます。GitHub Pagesは通常、HTTPSで配信されます。

### Gitコマンドでアップロードする場合

```bash
git init
git add .
git commit -m "Add Puzzle Box three-game PWA"
git branch -M main
git remote add origin https://github.com/<ユーザー名>/pocket-puzzle-arcade.git
git push -u origin main
```

※事前にGitHub側に空のリポジトリが必要です。

## iPhoneのホーム画面に追加

GitHub Pagesの公開URLを **Safari** で開き、「共有」→「ホーム画面に追加」を選択します。PWAとして独立した画面から起動できます。データはその端末のそのブラウザ内に保存されるため、端末をまたいだ同期機能はありません。

## ディレクトリ構成

```text
index.html                メイン画面
styles.css                画面デザイン
src/app.js                UIと画面遷移
src/sudoku.js             数独の問題生成・検証
src/gates.js              ゲートの計算
src/blocks.js             ブロックの配置・ライン消去
src/block-drag.js         ドラッグ座標・グリッドのスナップ計算
src/storage.js            セーブデータ保存
manifest.webmanifest      PWA設定
sw.js                     オフライン用キャッシュ
icons/                    オリジナルアプリアイコン
tests/                    ロジックの自動テスト
```

## 注意

セーブデータはブラウザのサイトデータを消去すると失われます。GitHub Pagesに公開する際、リポジトリとゲームURLが一般公開されます。個人情報は含めないでください。

MIT License.
