# Code quality and repository boundaries

このリポジトリは、公開サイトだけでなく **GitHub 上のソースコード自体もポートフォリオとしてレビューされる**ことを前提にしています。実装の責務、生成物、セキュリティ上の前提をここにまとめます。

## 責務の分離

| パス | 責務 |
|---|---|
| `theme/yohaku/` | Block Theme の表示、`theme.json`、テンプレート、パターン、表示上のセマンティクス |
| `theme/yohaku/assets/site.css` | ページ固有・コンポーネント固有の基本スタイル |
| `theme/yohaku/assets/quality-polish.css` | アクセシビリティ、堅牢性、レスポンシブ時の補正 |
| `theme/yohaku/assets/layout-system.css` | レイアウト幅、タイポグラフィ階層、余白、CTAなど横断デザインシステム |
| `plugins/yohaku-demo-form/` | Playground でだけ必要なデモバー、管理画面ガイド、非送信フォーム |
| `demo/content/` | Playground 起動時に投入する編集可能なコンテンツの原稿 |
| `demo/setup.php` | 新規 Playground を初期化する信頼済みブートストラップ処理 |
| `scripts/build.mjs` | ソースから Blueprint、Launch 用生成物、README を再生成 |
| `scripts/audit-source.mjs` | 公開ソースの静的な衛生・セキュリティ境界チェック |
| `scripts/validate.mjs` | Blueprint と生成物、主要な機能・回帰条件の静的検証 |

テーマは **サイトのプレゼンテーション** に集中し、Playground でしか使わない案内やフォーム挙動は専用プラグインへ分離しています。デモ用初期データもテーマ PHP に埋め込まず、`demo/` 配下へ分けています。

## PHP / WordPress 実装

- フックは名前付き関数へ紐付け、処理の意図を追いやすくしています。
- 出力する URL / attribute / 翻訳文字列は WordPress の `esc_url()` / `esc_attr()` / `esc_html__()` を使用します。
- 管理画面のデモガイドは `current_user_can('edit_pages')` で編集権限を確認します。
- テーマとデモプラグインには `$_GET` / `$_POST` 等を処理する独自エンドポイントを設けていません。
- デモフォームは JavaScript が submit を必ずキャンセルし、WordPress 側に保存・送信用のハンドラを登録していません。そのため nonce が必要な状態変更リクエスト自体が存在しません。
- `demo/setup.php` は Blueprint が新規 Playground を作成するときにだけ直接実行するブートストラップです。HTTP リクエスト入力は扱わず、リポジトリに同梱したデータだけを読み込みます。

実案件でフォーム送信や独自 REST API、Ajax、設定保存等を追加する場合は、この前提は成立しません。そこで初めて nonce、capability、sanitize、validation、rate limit 等を各入口に設計します。

## HTML / CSS / JavaScript

CSS は役割の異なる3層に分けています。`site.css` を基本コンポーネント、`quality-polish.css` をアクセシビリティと例外処理、`layout-system.css` を横断レイアウトとタイポグラフィの最終レイヤーとして扱います。新しい指定を追加するときは、まずどの責務に属するかを決め、同じ目的のルールを別レイヤーへ重複させない方針です。

デモフォームの JavaScript は IIFE 内に閉じ、グローバル変数を作りません。`fetch`、`XMLHttpRequest`、Web Storage、`innerHTML`、`eval` は使用せず、完了メッセージは `textContent` で更新します。

## 生成物と編集元

次のファイルは **生成物** です。直接編集しません。

| 生成物 | 編集元 |
|---|---|
| `blueprint.json` | `theme/`、`plugins/`、`demo/`、`scripts/build.mjs` |
| `demo/launch-blueprint.json` | 同上 |
| `demo/admin-launch-blueprint.json` | 同上 |
| `demo/launch.html` | `scripts/build.mjs` |
| `README.md` | `README.template.md` + `scripts/build.mjs` |

巨大な base64 + zlib ペイロードは Launch URL を短く保つための生成結果です。人がレビューするべき実装は `theme/`、`plugins/`、`demo/`、`scripts/` にあり、圧縮ペイロードを手編集する必要はありません。`.gitattributes` でも生成物を明示しています。

変更時の基本フローは次の通りです。

```sh
npm ci
npm run audit
npm run build
npm run validate
```

ブラウザ回帰まで確認する場合は、Playwright のブラウザを導入して `npm run quality` を実行します。

## Public リポジトリ向けチェック

`npm run audit` は少なくとも以下を確認します。

- TODO / FIXME / HACK や `debugger` の残骸が runtime source にないこと
- デモフォームが外部通信・Web Storage・HTML文字列挿入へ依存していないこと
- runtime PHP が request globals や独自 Ajax / REST / admin-post endpoint を処理していないこと
- 管理画面デモ導線に capability check があること
- theme / plugin の出力で escape API を使っていること
- 秘密鍵、APIキーらしい代入、個人PCのローカルパス、個人 Gmail アドレスが公開対象ソースへ混入していないこと
- 生成物と編集元の境界が `scripts/build.mjs` に残っていること

これは専用のセキュリティスキャナを置き換えるものではありませんが、自主制作ポートフォリオとして意図しない情報や暫定コードを公開しないための回帰ガードです。

## レビュー時の見どころ

1. `theme/yohaku/theme.json` と Block Theme のテンプレート構成
2. `demo/content/` が Gutenberg で編集できるコンテンツとして投入される流れ
3. `plugins/yohaku-demo-form/` にデモ固有挙動を隔離した構成
4. `scripts/build.mjs` が通常 Blueprint と短い Launch Blueprint を同じソースから生成する仕組み
5. `scripts/audit-source.mjs` / `scripts/validate.mjs` / browser QA による回帰ガード

この分離により、採用・案件レビュー時には巨大な生成JSONではなく、人が読むべきソースから設計意図を追えるようにしています。
