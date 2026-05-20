# 養生帖 (Yojo-chō)

入院中・療養中の自分用 記録 PWA。
iPhone のホーム画面に追加して、ネイティブアプリのように使えます。

## 記録できること

- **排泄**: 小 / 大 を都度 +1 で記録
- **リハビリ**: セッション単位で時刻・メモを記録 (1日 2〜4回想定)
- **足首 ROM** (角度): 自力上げ・補助上げ・自力下げ・補助下げ
- **履歴**: 過去の日次サマリ
- **推移**: ROM と排泄の日次グラフ

## データ保存

- すべて iPhone のブラウザ内 (localStorage) に保存
- メニューから JSON で **書き出し / 読み込み** 可能
- 念のため週に1回くらい JSON をメール等にバックアップしておくと安心

---

## GitHub Pages へのデプロイ手順 (iPhoneだけで完結)

### 1. リポジトリを作る

1. iPhone で GitHub (Web) を開く → 右上 `+` → `New repository`
2. リポジトリ名は何でもOK (例: `yojo-cho`)
3. **Public** を選択 (Private だと Pages が使えない無料プランの場合あり)
4. `Create repository`

### 2. ファイルをアップロード

1. リポジトリの `Add file` → `Upload files`
2. この zip を展開した中身 (`index.html`, `app.js`, `styles.css`, `manifest.json`, `service-worker.js`, `icons/` フォルダ) をすべてアップロード
3. `Commit changes`

### 3. GitHub Pages を有効化

1. リポジトリの `Settings` → 左メニュー `Pages`
2. `Source` → `Deploy from a branch`
3. `Branch` → `main` / `/ (root)` → `Save`
4. 1〜2分待つと、ページ上部に公開URLが表示される
   - 例: `https://あなたのユーザー名.github.io/yojo-cho/`

### 4. iPhone のホーム画面に追加

1. Safari でその URL を開く
2. 共有ボタン (□に↑) → **ホーム画面に追加**
3. アイコンができる → タップで全画面起動

これで完了です。
オフラインでもアプリは起動します (記録もできます)。

---

## カスタマイズしたい時

- すべてのファイルは GitHub の Web 上で直接編集可
- 色や文言は `styles.css` / `index.html` を編集
- 編集して `Commit` すると数十秒で反映 (PWAは再読込が必要なことあり)

## ファイル構成

```
yojo-cho/
├── index.html          ... 画面
├── styles.css          ... デザイン
├── app.js              ... ロジック
├── manifest.json       ... PWA設定
├── service-worker.js   ... オフライン対応
└── icons/
    ├── icon-192.png
    ├── icon-512.png
    ├── icon-512-maskable.png
    ├── apple-touch-icon.png
    └── favicon.png
```

お大事に。
