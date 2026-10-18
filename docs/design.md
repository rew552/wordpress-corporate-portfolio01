# 設計メモ

## デザイン

深いグリーン `#163d35`、オフホワイト `#f7f8f2`、ライム `#d9ec9b` を基調にする。色だけにブランド表現を依存せず、**タイポグラフィ、Editorial grid、罫線、セクション番号、余白、画像トリミング**を一貫した文法として使う。自作のSVG・PNG・PDFを使い、外部写真やフォント配信に依存しない。実在オフィスの写真や実績写真を装わない。

### Design Systemの責務

- `theme.json`: Gutenbergで編集者にも見える色・文字サイズ・spacing presetとWordPressの `contentSize / wideSize` を管理する。
- `assets/site.css`: Hero、Services、News、Formなど個々のコンポーネント固有の見た目を管理する。
- `assets/quality-polish.css`: 日本語折り返し、focus、responsive fallback、アクセシビリティなど壊れにくさを管理する。
- `assets/layout-system.css`: Container / measure / type hierarchy / spacing / CTA hierarchyの正本。最終レイヤーとして全ページへ同じ視覚ルールを適用する。

新しい全体ルールを追加するときは、まず `layout-system.css` のsemantic tokenで表現できないかを確認する。単一セクションだけの装飾は `site.css`、安全性・操作性は `quality-polish.css` に置き、同じ役割の値を複数レイヤーへ重複定義しない。

### ContainerとMeasure

WordPressの `theme.json` は `contentSize: 760px / wideSize: 1440px`。ただし、**Wide shellと実際に読む幅は別物**として扱う。

- Wide shell: `1440px`。背景、外枠、Editorial grid、全体の左右基準。
- Default content: `1180px`。通常のSection header、2カラム、下層ページの主要構造。
- Editorial content: `1280px`。Services index、News、Case gridなど情報量のある一覧。
- Reading measure: `42rem`。本文、Lead、CMS説明など。
- Heading measure: `18em` 前後。大型見出しが画面いっぱいに伸びないための上限。

外側の `alignwide` は全Sectionで同じ左右基準を保ち、内側のgridだけを適切なmeasureへ絞る。CSSで各Sectionの外枠をばらばらの `max-width` にせず、役割ごとの幅を使う。

再利用する主要クラス:

- `section-shell`: セクションの縦余白と境界
- `section-header`: セクション見出しと説明のEditorial grid
- `split-grid`: 2カラムの基本グリッド
- `content-measure`: 長文をreading measureへ制限
- `wide-content`: Editorial領域を使うコンテンツ
- `number-label` / `eyebrow`: セクション番号・メタ情報の視覚言語

### タイポグラフィ

日本語の `max-width` に `ch` を使わない。本文は `line-break: strict`、`overflow-wrap: normal` を基本にし、見出しは幅任せの `text-wrap: balance` に依存しない。Heroのブランドコピーのように意味単位が重要な箇所は、コンテンツ側で改行位置を明示する。

役割は次の通り。

- Display / Hero: `clamp(2.75rem, 4.6vw, 4.5rem)`、line-height 1.16。最大化より意味単位の改行を優先。
- Page H1: `clamp(2.5rem, 4vw, 3.75rem)`、line-height 1.22。
- Section H2: `clamp(2rem, 3vw, 3rem)`、line-height 1.3。
- Component H3: `clamp(1.375rem, 1.8vw, 1.75rem)`。
- Lead: `clamp(1.0625rem, 1.15vw, 1.25rem)`、2〜3行程度を目安。
- Body: `1rem`、line-height 1.85。
- Small / Meta / Eyebrow: 12〜14pxを中心にし、英字メタのみtrackingを広げる。
- Navigation / Button: 本文より一段小さく、操作としての44px前後の高さを確保する。

日本語では過剰な負のletter-spacingを避ける。Heroでも `-.025em` 程度を上限の目安とし、本文・Component headingは原則0とする。

### Spacingと密度

余白はpx値の寄せ集めではなく、次の役割で扱う。

- Section gap: 章の切り替わり。Desktopで84〜112px程度。
- Compact section: Approach / CMS Demoのように情報を近づけたいSection。
- Section header gap: 見出し群からMain contentまで40〜60px程度。
- Heading → Copy: 14〜20px程度。
- Copy → Action: 22〜30px程度。
- Component padding: 22〜32px程度。

**関係する要素は近く、章の切り替わりは大きく離す。** TOP全Sectionを同じ高さ・同じ密度にしない。Hero / Services / Demo Caseは広め、Approach / CMS Demoはやや密にして視覚的な緩急を作る。

### CTA hierarchy

- Primary: 次の主要行動。Forest背景 + White、44px程度の高さ。
- Secondary: 補助行動。OutlineでPrimaryより一段弱くする。
- Utility: 詳細、一覧、CMS内リンク。小さなテキストリンク + ruleで表現する。
- Header CTA: Primaryの縮小版。38px程度に抑え、Navigationより強くなりすぎない。
- Dark section CTA: Limeを使えるが、Limeの大面積利用はCTAまたは小さなaccentに限定する。

Hero CTAとCMS操作UIを同じ視覚重量にしない。CMS Demoの個別操作はUtility linkとして扱う。

### ブランド表現の文法

- Lime: CTA、5px前後の短いaccent、small geometryなど面積を限定して使う。大きな背景色として乱用しない。
- Rule: 情報の区切り。通常は1px、色は `--yohaku-rule` / `--yohaku-rule-strong` の2段階。
- Section number / Eyebrow: 左上の情報階層を示す。英字trackingは約`.14em`を基準にする。
- Radius: 基本4px、CTA bandなど大きな面でも8px程度。カードを丸くしすぎない。
- Image: Heroは非対称geometry、通常画像は4px程度。意味のない複数種類のradiusを増やさない。
- Dark section: Caseや強いCTAなど、章の切り替えを明確にしたい場所だけで使う。

装飾を増やすのではなく、**少ない要素を繰り返し使ってブランドとして認識させる**。

### セクションリズム

TOPは `Hero → Approach → Services → Demo Case → News → CMS Demo → CTA` とし、Hero直後に企業の価値・考え方を続ける。CMSデモは上部のPortfolio Demo Barで存在を知らせ、詳細は企業サイトの物語を中断しない後半へ置く。

Servicesは均質な白カード3枚ではなく、番号・キーワード・説明・outcomeを横方向に読むindex型。Newsは最新1件を大きく扱い、残り2件をcompact listにする。CMS Demoは横長の管理表にせず、`番号 + 体験内容 + Utility action` の小さな導線として積み上げる。下層はAbout / Services / Contactごとに専用レイアウトを持たせ、文章の縦積みだけにしない。

## コンテンツモデル
固定ページ9件（TOP / 紹介 / サービス / 会社 / お知らせ用 / 問い合わせ / 資料 / 保護 / プライバシー）、標準投稿3件、カテゴリ2件、メディアPNG1件。PDFはテーマ内に同梱し、実運用ではメディアへの置換を想定。CPTが必要な独立データ要件がないため追加しない。

## テーマ・CMS
Block Theme。theme.json v3で配色・幅・文字・エディター設定を共有。header/footerはtemplate partからpatternを参照。pattern内のURLはhome_urlでPlaygroundのスコープに合わせる。Navigationはモバイルでオーバーレイへ切り替える。TOPを含む本文はpost-contentから表示し、標準ブロックで編集可能。サービスカードは再利用可能なpatternも用意。Query Loopは標準投稿を日付降順で表示。一覧はmain queryを継承し、検索・カテゴリ・ページ送りに対応。TOPでは最新1件と続く2件を別Query Loopで編集的に見せる。

## フォーム
専用プラグインにショートコードとスクリプトを分離。外部プラグインより小さく、依存とデータ取り扱いを説明しやすい。ブラウザ標準制約検証を使い、submitをキャンセルして完了通知にフォーカスする。JS無効時は送信ボタンを無効化。入力欄にnameを付けず、fetch / storage / mail / DB保存処理を持たない。テーマ変更後もフォーム機能を維持できる。実受付には別実装が必要。

## Playground
build.mjsがソースを読み、テキストをwriteFiles、バイナリをbase64からrunPHPで展開する。テーマ有効化 → プラグイン有効化 → 初期化PHPの順で実行。テーマ・本文の取得にGitHub URLを参照しないため、未公開でも自己完結した同じBlueprintを起動できる。WordPressとPHP/WASMはPlaygroundが取得する。

READMEのLaunchリンクはraw.githubusercontent.com上の短いBlueprint URLを参照する。demo/launch.htmlとdemo/launch-blueprint.jsonはビルド入力から除外し、再生成時の二重取り込みを防ぐ。初期化PHPは使い捨てデモ専用。同じseed versionの再実行を抑止し、既存の同名固定ページを上書きしない。実サイトへの適用やseed versionの変更による再投入はサポートしない。

## SEO・アクセシビリティ
タイトル・canonical・サイトマップはWordPress標準。説明文をテーマで追加。デモはblog_public=0。保護ページ本文はmeta descriptionに含めない。WordPressのスキップリンク、main/header/footer、core Navigation、見出し階層、画像alt、フォーカスリング、ラベル、完了通知、reduced motionへ配慮。

## Visual QA
Visual Regressionのhash一致だけではデザイン品質を保証できないため、レスポンシブQAでは次も機械確認する。

- Wide shellの左右基準が揃うこと
- Default content / Reading measureがWide shellより明確に狭いこと
- HeaderのBrand / Navigation / CTAが同じ垂直中心に近いこと
- CMS Demoのactionがrow外へ離れず、横方向の視線移動が過大にならないこと
- 375〜1536pxの境界と、1920pxのwide viewportでoverflowしないこと
- Hero H1が意味単位の2行を維持し、1文字孤立などの不自然な折り返しがないこと
- axe / Chromium / Firefox / WebKitの既存QAを維持すること

Visual baselineの変更は自動承認しない。意図したデザイン変更のスクリーンショットをレビューしたうえで明示的に更新する。

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

GitHub Markdown変換APIで、巨大なhrefが除去される問題を避けるため、README用のdemo/launch-blueprint.jsonはソースとバイナリのマップをdeflate圧縮し、runPHPのgzuncompressで復元する転送形式にした。可読なblueprint.json、テーマ、本文、初期化PHPはそのまま維持する。

validate.mjsは圧縮データをNodeで復元し、可読Blueprintとファイル内容・バイナリ・後続ステップが一致することを確認する。両方とも公式Blueprintスキーマに適合する。
