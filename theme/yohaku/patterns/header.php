<?php
/**
 * Title: サイトヘッダー
 * Slug: yohaku/header
 * Inserter: no
 */
?>
<!-- wp:group {"className":"site-header","align":"wide","layout":{"type":"flex","justifyContent":"space-between","flexWrap":"nowrap"}} --><div class="wp-block-group site-header"><!-- wp:group {"layout":{"type":"constrained"}} --><div class="wp-block-group"><!-- wp:site-title {"level":0,"className":"brand"} /-->
</div><!-- /wp:group -->
<!-- wp:navigation {"overlayMenu":"mobile","ariaLabel":"メインナビゲーション","layout":{"type":"flex","justifyContent":"right"}} -->
<!-- wp:navigation-link {"label":"私たちについて","url":"<?php echo esc_url(home_url('/about/')); ?>","kind":"custom"} -->
<!-- /wp:navigation-link -->
<!-- wp:navigation-link {"label":"サービス","url":"<?php echo esc_url(home_url('/services/')); ?>","kind":"custom"} -->
<!-- /wp:navigation-link -->
<!-- wp:navigation-link {"label":"お知らせ","url":"<?php echo esc_url(home_url('/news/')); ?>","kind":"custom"} -->
<!-- /wp:navigation-link -->
<!-- wp:navigation-link {"label":"会社概要","url":"<?php echo esc_url(home_url('/company/')); ?>","kind":"custom"} -->
<!-- /wp:navigation-link -->
<!-- wp:navigation-link {"label":"お問い合わせ","url":"<?php echo esc_url(home_url('/contact/')); ?>","kind":"custom"} -->
<!-- /wp:navigation-link -->
<!-- /wp:navigation --></div><!-- /wp:group -->
