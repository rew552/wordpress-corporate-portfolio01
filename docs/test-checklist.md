# テスト記録・再確認チェックリスト

実施日：2026-10-17（日本時間）

## 環境
- WordPress **7.1.3**（Blueprintの `latest` が取得した安定版）
- PHP **8.3** / SQLite / 公式Playground CLI **3.1.58**
- Node.js **24.19.0**
- Chromium / Chrome for Testing **153.0.8010.12**、macOS
- 公式ブラウザ版 `https://playground.wordpress.net/` でも実行

## 実施結果

| 項目 | 結果・確認内容 |
|---|---|
| theme.json公式仕様 | PASS：取得時点のWordPress公式theme.json JSON Schemaに適合 |
| 公式Blueprint仕様 | PASS：公式CLI同梱JSON Schemaに適合 |
| READMEのLaunchリンク | PASS：URLを復号し圧縮起動版との一致、圧縮データ展開後に可読Blueprintとのファイル・バイナリ・後続ステップの一致を確認 |
| 未公開状態からの起動 | PASS：テーマ・専用プラグイン・本文・バイナリを自己完結Blueprintから展開 |
| 公式ブラウザ版起動 | PASS：READMEと同じリンクでTOP表示・サービスへのスコープ内移動 |
| GitHubでのREADME表示 | PASS：公式Markdown変換APIでLaunchのhrefが保持され、元URLと完全一致（28,968文字） |
| 管理画面 | PASS：公式ブラウザ版で日本語管理画面へ自動ログイン |
| 公式ブラウザ版CMS | PASS：固定ページへブロック追加→保存→公開画面で追加内容を確認 |
| 公開画面 | PASS：TOP・紹介・サービス・会社・お知らせ一覧・詳細・問い合わせ・資料・プライバシーの9画面、200・正しいh1・main・自主制作注記 |
| レスポンシブ | PASS：375 / 390 / 768 / 1440px × TOP・サービス・会社・問い合わせ・お知らせ一覧。横はみ出しなし |
| モバイルナビ | PASS：390pxで開閉・オーバーレイの表示確認 |
| 投稿一覧・分類 | PASS：一覧3件、カテゴリ「お知らせ」2件、カテゴリから対象記事へ遷移可能 |
| 検索 | PASS：業務で検索し関連コンテンツを表示 |
| 投稿詳細ルーティング | PASS：`/site-open/` に正しい記事見出し・本文を表示 |
| Gutenbergブロック | PASS：TOP・紹介・投稿詳細を開き、入れ子を含む全ブロックがvalid |
| 固定ページ編集 | PASS：標準段落ブロック追加→保存ボタン→公開画面反映→元の本文に復元 |
| 投稿編集 | PASS：既存お知らせの段落追加→保存ボタン→詳細URLへの反映→復元 |
| 画像差し替え | PASS：画像ブロックの置換→アップロード→標準メディア登録→保存→公開imgのURL変更を確認→元の画像に復元 |
| アイキャッチ | PASS：デモ記事への添付画像登録、詳細画面の画像読み込みを確認 |
| 画像表示 | PASS：公開main内の全画像が読み込み完了・naturalWidthあり |
| フォーム必須 | PASS：空のまま送信して完了表示されない |
| フォーム形式 | PASS：不正メールでcheckValidity=false。正しい入力と同意でtrue |
| フォーム完了 | PASS：完了通知、フォーカス移動、入力リセットを確認 |
| フォーム送信なし | PASS：フォーム操作中のPOST 0件、LocalStorage 0件。保存・通信APIを持たない実装も確認 |
| JavaScript無効 | PASS：送信ボタンが無効、noscript案内が表示される |
| PDF | PASS：リンク先200、`%PDF`ヘッダー。1ページを画像化し日本語・余白・図版・文字切れを目視確認 |
| パスワード保護 | PASS：未認証では本文なし、誤パスワードは解除されず、正しい値で本文表示 |
| 404 | PASS：存在しないURLで404ステータスと専用テンプレートを表示 |
| 基本アクセシビリティ | PASS：main/header/footer、単一h1、画像alt、入力ラベル、フォーカスCSS、標準スキップリンク、標準Navigationを確認 |
| JavaScript例外 | PASS：ローカル一連の画面操作でpageerror 0件 |
| ローカル再現 | PASS：配布先ディレクトリでnpm ci / build / validate / startを実行 |
| 開発依存 | PASS：Ajv・qs修正後、npm auditで既知の脆弱性0件（実施時点） |

## 確認画像

- `screenshots/home-desktop.png`：PC版全体
- `screenshots/home-mobile.png`：390px版全体
- `screenshots/navigation-mobile.png`：モバイルナビ
- `screenshots/contact.png` / `contact-success.png`：フォーム前後
- `screenshots/editor-page.png` / `editor-post.png`：標準ブロックエディター
- `screenshots/editor-image.png`：画像ブロックの編集
- `screenshots/playground-browser.png`：公式Playgroundの公開画面とDock
- `screenshots/playground-admin.png` / `playground-editor.png`：公式ブラウザ版の管理・保存画面

公開画面のスクリーンショットはログイン中ですが、デモ管理者の「サイトを見るときにツールバーを表示」を無効にしています。管理画面への導線はフッターにあります。画面・データはすべて架空デモです。

## 再現手順

1. `npm ci && npm run build && npm run validate && npm start` を実行する。
2. READMEのLaunchリンクを新しいブラウザ環境でも開く。
3. 公開ページ一覧を順に確認し、PC・スマートフォン幅に変更する。
4. お知らせと固定ページにテスト段落を追加して保存し、公開画面を再読み込みする。
5. 画像ブロックの「置換」からテストPNGをアップロードし、表示を確認する。
6. お知らせのアイキャッチ・カテゴリを設定し、一覧・詳細の表示を確認する。
7. テスト入力のみでフォームの必須・不正メール・同意・完了を試す。
8. 資料PDF、誤/正パスワード、存在しないURLを確認する。

## 検証範囲と留意点

- Safari / Firefox / 実機スマートフォン、スクリーンリーダー、全WCAG項目の網羅試験、負荷試験は未実施。
- デモ投稿3件のためページ送りの複数ページ状態は未検証。core Query Paginationを使用し、6件/ページで構成。
- 最新WordPressは将来変わるため、依存やWordPressの更新時には再確認する。
- 起動時に未使用の標準テーマの翻訳取得警告が出る場合がある。本テーマ、日本語コア管理画面、デモ初期化の完了は確認済み。
- 公開先は `rew552/wordpress-corporate-portfolio01`。GitHub公式Markdown変換APIによる自己完結リンクの保持は確認済み。公開URLからの起動確認は公開時の記録を参照。現在の自己完結Launchリンクは公開URLに依存しない。
