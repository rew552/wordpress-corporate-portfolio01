# GitHub公開手順

1. このディレクトリをPublic Repository `rew552/wordpress-corporate-portfolio01` に配置する。
2. Descriptionは `A WordPress corporate website portfolio showcasing responsive design and common business features.` に設定する。
3. READMEのLaunchリンクでTOPと管理画面を確認する。所有者名の置換は不要。
4. README、docs、screenshots、theme、demo、plugins、scripts、生成済みBlueprint、package-lockをコミットする。WordPress本体とnode_modulesは含めない。
5. 応募時はリポジトリURLと「自主制作・架空企業のWordPressコーポレートサイト」と明記する。

GitHub Pagesの設定は不要。

## 短い起動リンクへの変更（公開後の任意作業）

```text
https://playground.wordpress.net/?blueprint-url=https://raw.githubusercontent.com/rew552/wordpress-corporate-portfolio01/main/blueprint.json
```

上記はこのリポジトリの公開URL。READMEには短いリンクを併記し、元の自己完結リンクも維持している。raw URLがログインなしで200・JSON・CORS許可を返すことを確認する。README.template.mdとbuild.mjsを合わせて変更する。

## 資産
自作SVG・PNG・PDFのみ。外部写真、顧客ロゴ、実績の転載なし。GPL-2.0-or-later。WordPressとPlaygroundは同梱せず、実行時に公式配布から取得する。
