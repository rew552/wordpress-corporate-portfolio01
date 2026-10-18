# Yohaku Works — WordPress Corporate Portfolio

架空企業「余白ワークス」を題材にした、**自主制作のWordPressコーポレートサイト**です。

見た目だけでなく、WordPressの管理画面から文章・画像・お知らせ・ナビゲーションを更新できる、実運用を想定した構成にしています。

[**公開サイトを見る →**]({{LAUNCH_URL}})　 [**WordPress管理画面を試す →**]({{ADMIN_LAUNCH_URL}})

デモは **WordPress Playground** 上でブラウザだけで起動します。サーバー構築やアカウント作成は不要です。

> 自主制作作品です。実在企業のサイト・受託実績ではありません。

## できること

- TOP、サービス、会社概要、お知らせ、お問い合わせなどの企業サイト一式
- Gutenberg標準ブロックによるページ編集
- WordPress標準投稿を使ったお知らせ更新・一覧への自動反映
- Site Editorによるナビゲーション、ヘッダー、フッターの編集
- PC / Tablet / Mobileのレスポンシブ対応
- キーボード操作、見出し構造、フォーカス表示などのアクセシビリティ配慮
- 外部ページビルダーに依存しないWordPress標準機能中心の構成

## 技術構成

- WordPress Block Theme / `theme.json` v3
- Gutenberg / Query Loop / Site Editor
- WordPress Playground / Blueprint
- Playwright / axe

主なソースコードは以下です。

```text
theme/yohaku/             WordPressテーマ
plugins/yohaku-demo-form/ デモ専用機能
demo/                     初期コンテンツ・初期化処理
scripts/                  ビルド・検証・ブラウザQA
```

## ローカルで動かす

```sh
npm ci
npm run build
npm run validate
npm start
```

PHP / MySQL / Dockerのローカルインストールは不要です。

## デモについて

- Playground上で行った編集はGitHubのソースには反映されません。
- お問い合わせフォームは入力確認用のデモで、メール送信・データ保存・外部通信は行いません。
- 詳しい設計・コード品質方針は [docs/code-quality.md](docs/code-quality.md)、検証内容は [docs/test-checklist.md](docs/test-checklist.md) にまとめています。

## License

GPL-2.0-or-later
