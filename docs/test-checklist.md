# テスト記録・再確認チェックリスト

最終更新：2026-10-18（日本時間）

## 自動検証

### `npm run validate`

- WordPress Playground Blueprint公式Schema
- 公開サイトLaunch / 管理画面LaunchのBlueprint URLと生成物の整合性
- 圧縮Launch Blueprintと可読Blueprintのファイル・バイナリ一致
- `theme.json` v3
- Portfolio Demo Bar / Dashboard Guide / CMSデモセクションの存在
- favicon / OGPアセットの存在
- READMEのCMS訴求・管理画面スクリーンショット
- `section-shell / section-header / split-grid / content-measure / wide-content` の定義とTOPでの利用
- 日本語向け `max-width` に `ch` が再導入されていないこと
- TOPで Approach が CMS Demo より先に配置されていること
- Newsのfeatured / compact editorial layoutとDemo Caseの存在
- Issue #6の統一breakpoint（Mobile 767px以下 / Tablet 768〜1023px / Desktop 1024px以上）
- Skip Link / main landmark / current navigation stateの回帰ガード
- ServicesのTitleリンクとPattern構造ロック
- Company / Resources / Single PostのEditorial layout
- CIがVisual Regression baselineを自動更新しないこと

### `npm run quality`

Playgroundをローカル起動し、以下を自動確認する。

- Chromium / Firefox / WebKit
- TOP / About / Services / Company / Resources / Contact / News / Single Post / 404
- HTTPステータス
- `main` と単一 `h1`
- 横スクロールの発生有無
- Breakpoint境界値：375 / 390 / 599 / 600 / 601 / 760 / 761 / 767 / 768 / 781 / 782 / 783 / 820 / 900 / 960 / 1023 / 1024 / 1280 / 1440 / 1536px
- Header NavigationのOverlay切替、Header CTA、Demo Bar utility link、Services grid track数
- Chromium 390 / 820 / 1440px で axe WCAG 2 A / AA・2.1 A / AAのserious / critical違反
- CI上でスクリーンショットを生成し、復号後のRGB画素SHA-256 baselineと一致すること

WebKitはSafari相当エンジンの回帰試験であり、macOS / iOS実機Safariそのものを保証するものではない。

## Visual Regression Test

Visual Regressionの正本は `screenshots/visual-baseline.json`。CIのUbuntu + Chromium環境でフルページスクリーンショットを生成し、PNGを復号した後のRGB画素列に対するSHA-256を比較する。PNG圧縮表現の差は判定対象にせず、実際に描画された画素は厳密に比較する。

対象：

| ケース | 幅 | 対象 |
|---|---:|---|
| `home-mobile` | 390px | TOP Mobile |
| `home-tablet` | 820px | TOP Tablet |
| `home-desktop` | 1440px | TOP Desktop |
| `services-tablet` | 820px | Services Tablet |
| `single-desktop` | 1440px | News Single Desktop |

撮影前には全画像の読み込みに加えて `HTMLImageElement.decode()` の完了を待ち、遅延decodeによる未描画をbaseline差分として扱わない。`home-mobile` はGitHub Hosted Runnerで1px単位の字形ラスタライズ差が確認されたヘッダーのブランド文字だけをマスクし、同じブランド表記でもフッターを含むその他の領域は比較対象に残す。

差分が出た場合、CIはbaselineを自動更新しない。`visual-regression-actual` Artifactを目視確認し、意図した変更である場合のみ `screenshots/visual-baseline.json` を明示的に更新する。またVisual Regression差分が見つかってもFirefox / WebKitのルート・`h1`・overflow検査は最後まで実行し、1つの差分でクロスブラウザ検証結果を失わない。

OSごとのフォントレンダリング差をbaselineとして誤検知しないため、Visual Regressionのハッシュ比較はCI環境のみで実行する。ローカルではレイアウト・axe・クロスブラウザ検査を実施する。

## ビジュアルレビュー

既存のポートフォリオ紹介用スクリーンショットは、README等での見た目確認用として維持する。Visual Regressionの自動判定とは責務を分離し、CIから自動コミットしない。

手動レビューでは最低限、390 / 820 / 1024 / 1440pxを確認する。

- Header / Navigation / Demo Barが同じbreakpoint思想で切り替わる
- Services / Process / Demo Caseが中間幅で窮屈にならない
- 日本語見出し・英字ラベルが不自然な位置で折れない
- Focus Ringが明色・濃色背景の双方で見える
- Company / Resources / Single PostがTOPと同じEditorial design systemに見える

## 既存機能の手動確認実績

初期実装時に以下を実WordPress / 公式Playgroundで確認済み。

| 項目 | 確認内容 |
|---|---|
| CMS編集 | 固定ページ・投稿・画像差し替え・保存・公開反映 |
| 管理画面 | 日本語管理画面への自動ログイン |
| 投稿 | 一覧、カテゴリ、詳細、Query Loop |
| フォーム | 必須、メール形式、同意、完了通知、保存・外部送信なし |
| モバイルナビ | 390pxで開閉・オーバーレイ |
| PDF | HTTP 200 / PDFヘッダー / 目視 |
| 保護ページ | 誤・正パスワード |
| 404 / Search | 専用テンプレート・検索結果 |
| Gutenberg | TOP・固定ページ・投稿でブロックvalid |
| キーボード | Skip Link・フォーカス表示・標準Navigation・フォームラベル |
| JavaScript | 一連操作でpageerror 0件 |

Issue #1以降は、見た目の変更による基本回帰を `npm run quality` へ寄せ、CMSの保存操作などWordPress管理画面固有の操作は必要に応じて手動確認する。

## 推奨リリース前確認

- 実機iPhone / AndroidでTOP、ナビ、問い合わせを目視
- macOS Safari最新版でTOP、主要下層、管理画面への導線を目視
- 390 / 820 / 1024 / 1440pxでHeader・Services・News・Company・Resourcesを目視
- CMSでTOPコピー変更 → 更新 → 公開画面確認
- 新規投稿 → TOP / News一覧への反映
- 画像差し替え → 公開画面確認
- Lighthouseを参考値として確認
- OGPデバッガー等、本番公開先でのSNSカード確認

## 再現手順

```sh
npm ci
npm run build
npm run validate
npx playwright install chromium firefox webkit
npm run quality
```

公開先は `rew552/wordpress-corporate-portfolio01`。Playgroundの公開サイト用・管理画面用Blueprint URLをそれぞれ生成する。
