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
- READMEの公開サイト / 管理画面Launchリンク
- `section-shell / section-header / split-grid / content-measure / wide-content` の定義とTOPでの利用
- 日本語向け `max-width` に `ch` が再導入されていないこと
- TOPで Approach が CMS Demo より先に配置されていること
- Newsのfeatured / compact editorial layoutとDemo Caseの存在
- 統一breakpoint（Mobile 767px以下 / Tablet 768〜1023px / Desktop 1024px以上）
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
- Design Reviewで375 / 390 / 768 / 820 / 1024 / 1440 / 1536 / 1920pxの主要レイアウトを検証
- Demo Caseの同一行でコンテナ・ラベル・見出し・本文の開始位置が2px以内に揃うこと
- 重要コピーの `サイト` / `います` が途中改行されないこと
- 主要セクション見出しに1〜2文字だけの孤立行が生じないこと
- CI上でスクリーンショットを一時生成し、復号後のRGB画素SHA-256 baselineと一致すること

WebKitはSafari相当エンジンの回帰試験であり、macOS / iOS実機Safariそのものを保証するものではない。

## Visual Regression Test

Visual Regressionの正本は `screenshots/visual-baseline.json`。CIのUbuntu + Chromium環境でフルページスクリーンショットを一時生成し、PNGを復号した後のRGB画素列に対するSHA-256を比較する。PNG圧縮表現の差は判定対象にせず、実際に描画された画素は厳密に比較する。

| ケース | 幅 | 対象 |
|---|---:|---|
| `home-mobile` | 390px | TOP Mobile |
| `home-tablet` | 820px | TOP Tablet |
| `home-desktop` | 1440px | TOP Desktop |
| `services-tablet` | 820px | Services Tablet |
| `single-desktop` | 1440px | News Single Desktop |

撮影前には全画像の読み込みに加えて `HTMLImageElement.decode()` の完了を待ち、遅延decodeによる未描画をbaseline差分として扱わない。`home-mobile` はGitHub Hosted Runnerで1px単位の字形ラスタライズ差が確認されたヘッダーのブランド文字だけをマスクし、同じブランド表記でもフッターを含むその他の領域は比較対象に残す。

差分が出た場合、CIはbaselineを自動更新しない。`visual-regression-actual` Artifactを目視確認し、意図した変更である場合のみ `screenshots/visual-baseline.json` を明示的に更新する。Visual Regression差分が見つかってもFirefox / WebKitのルート・`h1`・overflow検査は最後まで実行し、1つの差分でクロスブラウザ検証結果を失わない。

OSごとのフォントレンダリング差をbaselineとして誤検知しないため、Visual Regressionのハッシュ比較はCI環境のみで実行する。ローカルではレイアウト・axe・クロスブラウザ検査を実施する。

## Visual QAフロー

Visual QAは「テストが通った」「画面を一度眺めた」だけでは完了としない。各viewportで、**大きなズレ → 同種要素の相互比較 → 文字組み**の順に確認する。

### 必須レビュー幅

最低限、次の4幅を確認する。

- 390px: mobile
- 820px: tablet
- 1024px: desktop境界
- 1440px: standard desktop

変更内容に応じて375 / 768 / 1280 / 1536pxも追加する。特にbreakpoint、コンテナ幅、フォントサイズ、grid列数を変更した場合は境界値の前後を確認する。

### 1. マクロレイアウト

最初にページを10〜25%程度へ縮小し、文章を読まずにシルエットだけを見る。

- セクション間の余白が一貫している
- 同一グリッドの開始位置・高さが揃っている
- 左右端、中央線、ベースラインに不自然なズレがない
- 1要素だけ上・下・左・右へ飛び出していない
- `:first-child` / `:last-child` だけ意図しないmargin / paddingを持っていない
- セクション全体の視覚的重心が偏っていない

### 2. コンポーネント比較

次に100%表示へ戻し、同じ役割の要素を横並びで相互比較する。

主な対象:

- Demo Caseの01 / 02 / 03 / 04
- Services行
- Newsカード
- Header / Footer
- CTA / Button

確認項目:

- ラベルのY座標が揃っている
- 見出しの開始位置が揃っている
- 本文の開始位置が揃っている
- 内側余白が揃っている
- borderの開始・終了位置が揃っている
- 兄弟要素のうち1つだけ例外的なmargin / paddingを持っていない

機械判定できる整列はPlaywrightでbounding boxを取得し、原則2px以内を許容値とする。Demo Caseではコンテナtop / bottom、ラベルtop、見出しtop、本文topを同一行内で比較する。

### 3. タイポグラフィ・日本語折り返し

レイアウト確認後に文章を読む。

- `サイト` → `サ / イト` のように意味のある語が途中で分断されていない
- `います` → `いま / す` のように助動詞が不自然に分断されていない
- 助詞・助動詞・句読点だけが次行に孤立していない
- 見出しで1〜2文字だけ次行に落ちていない
- `WordPress` / `CMS` / `Navigation` 等の重要語が壊れていない
- 行長・行間・見出し幅が日本語として自然

通常の日本語本文はブラウザの禁則処理に任せる。重要コピーで意味単位を守る必要がある場合だけ、最小範囲のspan + `white-space: nowrap`を使う。見出しや段落全体をnowrapにしてoverflowを隠す実装は行わない。

### 4. 状態変化

静止画だけで終わらせず、変更箇所に関連する状態も確認する。

- Hover
- Keyboard Focus
- Navigation開閉
- Current page state
- CTA / Linkのhover・focus
- CMS編集でコピーが変わった場合の再flow

### 5. 自動テスト・Visual Regressionとの照合

最後に自動テスト結果とスクリーンショット差分を確認する。Visual Regressionのhash一致は「既知baselineと同じ」であることしか保証しないため、baseline更新時は差分画像を必ず目視する。

## PRレビュー時のVisual QAチェックリスト

- [ ] 390 / 820 / 1024 / 1440pxで主要画面を確認した
- [ ] ページ全体を縮小して大きな位置ズレを確認した
- [ ] 同一グリッド内の兄弟要素を横比較した
- [ ] 1番目/最後の要素だけ位置・余白が異なっていない
- [ ] 見出しの開始位置が揃っている
- [ ] 本文の開始位置が揃っている
- [ ] 単語途中の不自然な日本語改行がない
- [ ] 1〜2文字だけの孤立行がない
- [ ] Hover / Focus / Navigation等の状態も崩れていない
- [ ] Visual Regression差分を目視確認した
- [ ] 「テストが通った」だけでVisual QA完了と判断していない

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

見た目の変更による基本回帰は `npm run quality` へ寄せ、CMSの保存操作などWordPress管理画面固有の操作は必要に応じて手動確認する。

## 推奨リリース前確認

- 実機iPhone / AndroidでTOP、ナビ、問い合わせを目視
- macOS Safari最新版でTOP、主要下層、管理画面への導線を目視
- CMSでTOPコピー変更 → 更新 → 公開画面確認
- 新規投稿 → TOP / News一覧への反映
- 画像差し替え → 公開画面確認
- OGPデバッガー等、本番公開先でのSNSカード確認

## 再現手順

```sh
npm ci
npm run build
npm run validate
npx playwright install chromium firefox webkit
npm run quality
```

公開先は `rew552/wordpress-corporate-portfolio01`。Playgroundの公開サイト用・管理画面用Blueprint URLをそれぞれ利用する。
