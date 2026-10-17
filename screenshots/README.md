# 確認画像

すべて実際に起動したWordPress / Playgroundの画面です。架空企業の自主制作ポートフォリオです。

| 画像 | 内容 |
|---|---|
| overview.png | PC版ファーストビュー |
| home-desktop.png | 1440pxのTOP全体。`npm run quality` で更新 |
| home-wide.png | 1536pxのTOP全体。wide layoutのビジュアルQA用 |
| home-tablet.png | 768pxのTOP全体。タブレット境界のビジュアルQA用 |
| home-mobile.png | 390pxのTOP全体。`npm run quality` で更新 |
| navigation-mobile.png | モバイルナビゲーション |
| contact.png / contact-success.png | フォームの入力前と完了後 |
| editor-page.png / editor-post.png | 固定ページと投稿のブロックエディター |
| editor-image.png | 画像ブロックの標準編集画面 |
| playground-browser.png | 公式Playground上の公開画面 |
| playground-admin.png | 公式Playground上の日本語管理画面 |
| playground-editor.png | 公式Playground上で保存を行ったエディター |

公開サイトにはポートフォリオ専用のDemo Barがあり、架空企業のナビゲーションとは分離してCMSデモへの導線を表示します。編集テスト中の画像には確認用文章が含まれる場合があります。

Issue #4以降は 390 / 768 / 1440 / 1536px の4枚をCIで更新し、1280pxを含むレスポンシブoverflow検査とあわせてビジュアルレビューします。
