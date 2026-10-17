<?php
/**
 * Title: サイトヘッダー
 * Slug: yohaku/header
 * Inserter: no
 */
?>
<!-- wp:group {"className":"site-header","align":"wide","layout":{"type":"flex","justifyContent":"space-between","flexWrap":"nowrap"}} --><div class="wp-block-group alignwide site-header"><!-- wp:group {"className":"header-brand","layout":{"type":"flex","flexWrap":"nowrap"}} --><div class="wp-block-group header-brand"><!-- wp:site-title {"level":0,"className":"brand"} /--><!-- wp:paragraph {"className":"brand-subtitle"} --><p class="brand-subtitle">WORKFLOW / DIGITAL / SUPPORT</p><!-- /wp:paragraph --></div><!-- /wp:group -->
<!-- wp:group {"className":"header-actions","layout":{"type":"flex","justifyContent":"right","flexWrap":"nowrap"}} --><div class="wp-block-group header-actions"><!-- wp:navigation {"overlayMenu":"mobile","ariaLabel":"メインナビゲーション","layout":{"type":"flex","justifyContent":"right"}} /--><!-- wp:buttons {"className":"header-cta"} --><div class="wp-block-buttons header-cta"><!-- wp:button --><div class="wp-block-button"><a class="wp-block-button__link wp-element-button" href="<?php echo esc_url(home_url('/contact/')); ?>">お問い合わせ →</a></div><!-- /wp:button --></div><!-- /wp:buttons --></div><!-- /wp:group --></div><!-- /wp:group -->
