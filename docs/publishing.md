# GitHub公開手順

1. このディレクトリをPublic Repository `rew552/wordpress-corporate-portfolio01` に配置する。
2. Descriptionは `A WordPress corporate website portfolio showcasing responsive design and common business features.` に設定する。
3. READMEの「公開サイトを体験する」「CMS管理画面を試す」でそれぞれTOPと管理画面を確認する。
4. README、docs、screenshots、theme、demo、plugins、scripts、生成済みBlueprint、package-lockをコミットする。WordPress本体とnode_modulesは含めない。
5. 応募時はリポジトリURLと「自主制作・架空企業のWordPressコーポレートサイト」と明記する。

GitHub Pagesの設定は不要。

## Playground起動リンク

READMEのCTAは、GitHub Raw上の生成済みBlueprintを読み込む短いリンクを使う。

```text
公開サイト:
https://playground.wordpress.net/?blueprint-url=https://raw.githubusercontent.com/rew552/wordpress-corporate-portfolio01/main/demo/launch-blueprint.json

管理画面:
https://playground.wordpress.net/?blueprint-url=https://raw.githubusercontent.com/rew552/wordpress-corporate-portfolio01/main/demo/admin-launch-blueprint.json
```

`demo/launch-blueprint.json` と `demo/admin-launch-blueprint.json` は同じデモ環境を作り、`landingPage` だけを `/` と `/wp-admin/` に分ける。長大な自己完結URLをREADMEへ埋め込まず、GitHub Markdown上で安定して扱える短いCTAを優先する。

`blueprint.json` はローカルCLI・デバッグ用の可読なCanonical Blueprintとして維持する。raw URLがログインなしで取得できることは公開時に確認する。

## 資産

自作SVG・PNG・PDFのみ。外部写真、顧客ロゴ、実績の転載なし。GPL-2.0-or-later。WordPressとPlaygroundは同梱せず、実行時に公式配布から取得する。
