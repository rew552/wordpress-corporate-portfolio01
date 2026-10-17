# Yohaku Works — WordPress Corporate Portfolio

**「見た目」だけでなく、更新しやすさまで設計した企業サイトの自主制作ポートフォリオです。**

架空の地域企業「余白ワークス」を題材に、WordPressの標準機能を中心として、公開サイト・CMS編集・レスポンシブ・アクセシビリティまで一体で設計しました。実在企業の受託実績や顧客実績を示すものではありません。

[公開サイトを体験する →](https://playground.wordpress.net/?blueprint-url=https%3A%2F%2Fraw.githubusercontent.com%2Frew552%2Fwordpress-corporate-portfolio01%2Fmain%2Fdemo%2Flaunch-blueprint.json)　　[CMS管理画面を試す ↗](https://playground.wordpress.net/?blueprint-url=https%3A%2F%2Fraw.githubusercontent.com%2Frew552%2Fwordpress-corporate-portfolio01%2Fmain%2Fdemo%2Fadmin-launch-blueprint.json)

どちらも **WordPress Playground** 上に使い捨て環境を作成します。サーバー契約やアカウント作成は不要で、管理画面側は管理者として自動ログインします。

![TOP / desktop](screenshots/home-desktop.png)

## このポートフォリオで確認できること

- **管理画面から文章・画像・お知らせ・ナビゲーションを更新**できる
- TOPページもテーマファイルに固定せず、標準ブロックで編集できる
- 新しいお知らせを投稿すると、TOP・一覧へ自動反映される
- Site Editorからヘッダー・フッター・共通スタイルを確認できる
- PC / Tablet / Mobileを想定したレスポンシブ設計
- キーボード操作、フォーカス表示、見出し階層、reduced motion等に配慮
- 外部テーマ・外部UIビルダーへ依存せず、WordPress標準機能を中心に構成

| 公開サイト | WordPress管理画面 |
|---|---|
| ![TOP / mobile](screenshots/home-mobile.png) | ![Playground admin](screenshots/playground-admin.png) |

## CMSデモの試し方

公開サイト上部の **PORTFOLIO DEMO** バーから管理画面へ移動できます。管理画面のダッシュボードには「このデモで試せること」を表示しています。

1. **TOPページを編集** — コピーやセクションをブロックエディターで変更
2. **お知らせを追加** — 投稿を公開し、TOP・一覧への自動反映を確認
3. **画像を差し替え** — メディアライブラリから追加・置換
4. **サイト全体を編集** — Site Editorでヘッダー・フッター・Navigationを確認
5. **公開サイトを確認** — 編集結果をそのままブラウザで確認

Playgroundはデモ専用の使い捨て環境です。変更はGitHubのソースへ反映されません。フォームも入力検証と完了表示のみで、メール送信・保存・外部通信は行いません。

## 制作方針

想定企業は、地域の中小企業の業務改善を支援する架空企業です。派手なプラグイン構成ではなく、**非エンジニアが運用を継続できること**と、引き継ぎやすい実装を優先しました。

- Block Theme / `theme.json` v3
- 固定ページ + Gutenberg標準ブロック
- 標準投稿 + Query Loop
- WordPress Navigation / Site Editor
- Playground / Blueprintによるブラウザ完結デモ
- テーマとデモ固有挙動を分離
- 架空の成果数値・顧客ロゴ・実績を使用しない

## ページ・機能

| ページ | パス | 内容 |
|---|---|---|
| TOP | `/` | Editorial Hero、CMSデモ導線、サービス、最新投稿、CTA |
| 私たちについて | `/about/` | 理念、画像ブロック、価値観 |
| サービス | `/services/` | 3つの支援内容、進め方 |
| 会社概要 | `/company/` | 架空企業の情報表 |
| お知らせ | `/news/` | 標準投稿一覧、分類、ページ送り、空状態 |
| お知らせ詳細 | `/site-open/` 等 | 本文、カテゴリ、アイキャッチ、前後の記事 |
| お問い合わせ | `/contact/` | 必須・形式・同意・完了表示を含むデモフォーム |
| 資料 | `/resources/` | 同梱PDF、パスワード保護例への導線 |
| 保護ページ | `/partners/` | WordPress標準のパスワード保護 |
| プライバシー | `/privacy/` | デモ上のデータ取り扱い |
| その他 | 404 / Search / Category | 共通デザイン・検索・一覧 |

## CMSで更新できる箇所

| 更新対象 | 操作 |
|---|---|
| TOPの文章・サービス紹介 | 固定ページ「ホーム」の標準ブロックを編集 |
| 新しいお知らせ | 投稿を追加し、カテゴリ・抜粋・アイキャッチを設定 |
| お知らせ一覧 | 投稿データから自動表示。本文の手動更新不要 |
| 会社情報・サービス本文 | 対象の固定ページを編集 |
| 画像 | 画像ブロックの「置換」からメディアを選択・アップロード |
| サイト名 | 設定 → 一般、またはSite Editorのサイトタイトル |
| ナビゲーション | 外観 → エディター → Navigationブロック |
| 共通ヘッダー・フッター | 外観 → エディター |
| 配色・書体 | Site Editorのスタイル / `theme.json` |
| PDF | メディアへ追加して資料ページのリンクを置換 |
| 保護設定 | 固定ページの公開状態 → パスワード保護 |

## 技術設計

`templates/front-page.html` は固定ページ本文を表示するだけにし、TOPの内容をテーマテンプレートへ閉じ込めていません。文章、カード、画像、CTAをCMS側で編集できます。

お知らせは標準投稿を利用し、CPTは追加していません。問い合わせフォームのデモ挙動、Portfolio Demo Bar、Dashboard GuideはPlayground専用プラグインへ分離し、テーマ本体はプレゼンテーションに集中させています。

配色は深いグリーン / オフホワイト / ライムを軸にし、日本語の折り返し、行間、余白、Editorial Layoutを調整しています。外部フォント・外部画像サービス・アクセス解析への依存はありません。

## 品質確認

`npm run validate` ではBlueprint、公開サイト / 管理画面Launch URL、生成物とソースの整合性、CMSデモ導線などを静的検証します。

`npm run quality` ではローカルPlaygroundを起動し、**Chromium / Firefox / WebKit**、375 / 390 / 768 / 1024 / 1440px、主要ページ、404、横スクロール、h1、axeによるWCAG A/AAのserious / critical違反を確認します。

詳細は [docs/test-checklist.md](docs/test-checklist.md) を参照してください。

## ローカル確認

Node.js **24.18.0以上** とnpmをご用意ください。PHP・MySQL・Dockerのローカルインストールは不要です。

```sh
npm ci
npm run build
npm run validate
npm start
```

ブラウザQAまで実施する場合はPlaywrightのブラウザを用意してから実行します。

```sh
npx playwright install chromium firefox webkit
npm run quality
```

テーマ・デモコンテンツを変更したら `npm run build` でBlueprint、公開サイトLaunch、管理画面Launch、READMEを再生成します。READMEの編集元は `README.template.md` です。

## リポジトリ構成

```text
.
├── theme/yohaku/             # 自作Block Theme
├── plugins/yohaku-demo-form/ # CMSデモガイド + デモフォーム
├── demo/                     # 初期コンテンツ・初期化・生成Launch Blueprint
├── scripts/                  # build / validate / browser quality
├── blueprint.json            # Playground用Blueprint
├── docs/                     # 要件・設計・検証記録・公開手順
├── screenshots/              # 実WordPress上の確認画像
├── README.template.md        # README編集元
└── README.md                 # buildで生成
```

## 制約

- フォームは実際の問い合わせ受付を行いません。
- Playgroundの編集内容は再起動等で失われる場合があります。
- `preferredVersions.wp: latest` のためWordPress更新時は再検証します。
- 実案件への転用時は、実情報への置換、送信基盤、スパム対策、バックアップ、権限、更新運用を別途設計します。
- WebKitによる自動試験はSafari相当エンジンの回帰確認であり、実機Safariそのものを保証するものではありません。

## ライセンス

GPL-2.0-or-later。テーマ・専用プラグイン・独自ドキュメント・自作図版・同梱PDFに適用します。WordPress / Playgroundは各プロジェクトのライセンスに従います。
