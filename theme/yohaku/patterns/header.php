<?php
/**
 * Title: サイトヘッダー
 * Slug: yohaku/header
 * Inserter: no
 */
$navigation = get_page_by_path('primary-navigation', OBJECT, 'wp_navigation');
$navigation_attributes = [
    'overlayMenu' => 'mobile',
    'ariaLabel' => 'メインナビゲーション',
    'layout' => [
        'type' => 'flex',
        'justifyContent' => 'right',
    ],
];
if ($navigation) {
    $navigation_attributes['ref'] = (int) $navigation->ID;
}
?>
<!-- wp:group {"className":"site-header","align":"wide","layout":{"type":"flex","justifyContent":"space-between","flexWrap":"nowrap"}} --><div class="wp-block-group site-header"><!-- wp:group {"layout":{"type":"constrained"}} --><div class="wp-block-group"><!-- wp:site-title {"level":0,"className":"brand"} /-->
</div><!-- /wp:group -->
<!-- wp:navigation <?php echo wp_json_encode($navigation_attributes, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES); ?> /--></div><!-- /wp:group -->
