# テスト記録・再確認チェックリスト

最終更新：2026-10-17（日本時間）

## 自動検証

### `npm run validate`

- WordPress Playground Blueprint公式Schema
- 公開サイトLaunch / 管理画面Launchの復号・生成物一致
- 圧縮Launchと可読Blueprintのファイル・バイナリ一致
- `theme.json` v3
- Portfolio Demo Bar / Dashboard Guide / CMSデモセクションの存在
- favicon / OGPアセットの存在
- READMEのCMS訴求・管理画面スクリーンショット

### `npm run quality`

Playgroundをローカル起動し、以下を自動確認する。

- Chromium / Firefox / WebKit
- TOP / Services / Contact / News / 404
- HTTPステータス
- `main` と単一 `h1`
- 横スクロールの発生有無
- axe WCAG 2 A / AA・2.1 A / AAの serious / critical 違反
- Chromiumで 375 / 390 / 768 / 1024 / 1440px
- 1440px / 390px のTOPスクリーンショット更新

WebKitはSafari相当エンジンの回帰試験であり、macOS / iOS実機Safariそのものを保証するものではない。

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
| キーボード | フォーカス表示・標準Navigation・フォームラベル |
| JavaScript | 一連操作でpageerror 0件 |

Issue #1以降は、見た目の変更による基本回帰を `npm run quality` へ寄せ、CMSの保存操作などWordPress管理画面固有の操作は必要に応じて手動確認する。

## 推奨リリース前確認

- 実機iPhone / AndroidでTOP、ナビ、問い合わせを目視
- macOS Safari最新版でTOP、主要下層、管理画面への導線を目視
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

公開先は `rew552/wordpress-corporate-portfolio01`。Playgroundの自己完結Launchリンクは公開サイト用と管理画面用の2種類を生成する。
