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
