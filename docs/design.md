# 設計メモ

## デザイン
深いグリーン `#163d35`、オフホワイト `#f7f8f2`、ライム `#d9ec9b`。最大幅1200px、本文760px。日本語の行間と余白を広くとる。自作のSVG・PNG・PDFを使い、外部写真やフォント配信に依存しない。実在オフィスの写真や実績写真を装わない。

## コンテンツモデル
固定ページ9件（TOP / 紹介 / サービス / 会社 / お知らせ用 / 問い合わせ / 資料 / 保護 / プライバシー）、標準投稿3件、カテゴリ2件、メディアPNG1件。PDFはテーマ内に同梱し、実運用ではメディアへの置換を想定。CPTが必要な独立データ要件がないため追加しない。

## テーマ・CMS
Block Theme。theme.json v3で配色・幅・文字・エディター設定を共有。header/footerはtemplate partからpatternを参照。pattern内のURLはhome_urlでPlaygroundのスコープに合わせる。Navigationはモバイルでオーバーレイへ切り替える。TOPを含む本文はpost-contentから表示し、標準ブロックで編集可能。サービスカードは再利用可能なpatternも用意。Query Loopは標準投稿を日付降順で表示。一覧はmain queryを継承し、検索・カテゴリ・ページ送りに対応。TOPのみ3件の独立クエリ。

## フォーム
専用プラグインにショートコードとスクリプトを分離。外部プラグインより小さく、依存とデータ取り扱いを説明しやすい。ブラウザ標準制約検証を使い、submitをキャンセルして完了通知にフォーカスする。JS無効時は送信ボタンを無効化。入力欄にnameを付けず、fetch / storage / mail / DB保存処理を持たない。テーマ変更後もフォーム機能を維持できる。実受付には別実装が必要。

## Playground
build.mjsがソースを読み、テキストをwriteFiles、バイナリをbase64からrunPHPで展開する。テーマ有効化 → プラグイン有効化 → 初期化PHPの順で実行。テーマ・本文の取得にGitHub URLを参照しないため、未公開でも自己完結した同じBlueprintを起動できる。WordPressとPHP/WASMはPlaygroundが取得する。

READMEのLaunchリンクは公式仕様のURLエンコードJSON fragment。GitHub公開後はraw.githubusercontent.comのblueprint-urlに短縮できる。demo/launch.htmlとdemo/launch-blueprint.jsonはビルド入力から除外し、再生成時の二重取り込みを防ぐ。初期化PHPは使い捨てデモ専用。同じseed versionの再実行を抑止し、既存の同名固定ページを上書きしない。実サイトへの適用やseed versionの変更による再投入はサポートしない。

## SEO・アクセシビリティ
タイトル・canonical・サイトマップはWordPress標準。説明文をテーマで追加。デモはblog_public=0。保護ページ本文はmeta descriptionに含めない。WordPressのスキップリンク、main/header/footer、core Navigation、見出し階層、画像alt、フォーカスリング、ラベル、完了通知、reduced motionへ配慮。

## 公式仕様の確認（2026-10-17）
- [Blueprint steps](https://developer.wordpress.org/playground/blueprints/steps/)
- [起動方法・Base64 fragment](https://developer.wordpress.org/playground/blueprints/tutorial/how-to-load-run/)
- [Blueprint bundles](https://developer.wordpress.org/playground/blueprints/bundles/)
- [Theme JSON](https://developer.wordpress.org/block-editor/how-to-guides/themes/global-settings-and-styles/)

Blueprint v1のwriteFiles / runPHP / activateTheme / activatePlugin / loginを採用。取得した公式JSON Schemaで検証する。Node依存は開発とローカル確認専用であり、テーマの表示には不要。

## 検証で確定した注意点
Blueprintのmeta.titleは英字にする。日本語のmeta.titleから生成されたブラウザ版Playgroundのscope URLでページ遷移が失敗したため、環境名のみ英字に変更した。サイト名・本文・管理画面は日本語。

パーマリンクは初期化中のWP_Rewriteオブジェクトにも反映するため、set_permalink_structureを呼び、最後にflush_rewrite_rulesを実行する。オプション値だけの変更では詳細投稿URLのrewriteルールが古いままになるため、投稿詳細と404を受け入れテストに含める。

Playground CLI 3.1.58の実行ファイル名はwp-playground-cli。npm startはその実際のbin名を使用。開発依存のAjvを8.20.0、qsを6.16.0へ固定し、既知の依存問題を解消した。テーマ・専用プラグインはこれらのNode依存を必要としない。

## GitHubのリンク表示に対応する圧縮転送

GitHub Markdown変換APIで、95KBのhrefが除去されることを確認した。このためREADME用のdemo/launch-blueprint.jsonは、ソースとバイナリのマップをdeflate圧縮し、runPHPのgzuncompressで復元する転送形式にした。起動リンクは約29KBで、実際のGitHub Markdown APIの返すhrefとの完全一致を確認している。PHPはPlayground同梱の標準zlib機能のみを使う。可読なblueprint.json、テーマ、本文、初期化PHPはそのまま維持する。

validate.mjsは圧縮データをNodeで復元し、可読Blueprintとファイル内容・バイナリ・後続ステップが一致することを確認する。両方とも公式Blueprintスキーマに適合。生成リンクはMarkdown構文と干渉する括弧等もエンコードし、32000文字以内をビルド時に検査する。
