<?php
/** Theme presentation only. Demo behavior lives in a separate plugin. */
if (!defined('ABSPATH')) { exit; }

add_action('after_setup_theme', function () {
    add_theme_support('editor-styles');
    add_editor_style('assets/site.css');
    add_editor_style('assets/quality-polish.css');
    add_editor_style('assets/layout-system.css');
    load_theme_textdomain('yohaku', get_template_directory() . '/languages');
});

add_action('wp_enqueue_scripts', function () {
    $version = wp_get_theme()->get('Version');
    wp_enqueue_style('yohaku-site', get_theme_file_uri('assets/site.css'), [], $version);
    wp_enqueue_style('yohaku-quality-polish', get_theme_file_uri('assets/quality-polish.css'), ['yohaku-site'], $version);
    wp_enqueue_style('yohaku-layout-system', get_theme_file_uri('assets/layout-system.css'), ['yohaku-quality-polish'], $version);
});

add_action('wp_body_open', function () {
    echo '<a class="skip-link" href="#main-content">' . esc_html__('本文へスキップ', 'yohaku') . '</a>';
});

/**
 * Add a stable main landmark target and tighten a few presentation-only block details.
 * The source content stays editable; these changes only improve rendered semantics.
 */
add_filter('render_block', function ($block_content, $block) {
    $block_name = $block['blockName'] ?? '';
    $attrs = $block['attrs'] ?? [];

    if ($block_name === 'core/group' && ($attrs['tagName'] ?? '') === 'main' && !str_contains($block_content, 'id="main-content"')) {
        $block_content = preg_replace('/<main\b/', '<main id="main-content"', $block_content, 1);
    }

    if ($block_name === 'core/group' && str_contains((string)($attrs['className'] ?? ''), 'service-row')) {
        if (!str_contains($block_content, 'service-row__title-link') && preg_match('/<p class="service-row__arrow"><a href="([^"]+)"[^>]*>→<\/a><\/p>/', $block_content, $match)) {
            $href = esc_url($match[1]);
            $block_content = preg_replace(
                '/<h3([^>]*)>(.*?)<\/h3>/',
                '<h3$1><a class="service-row__title-link" href="' . $href . '">$2</a></h3>',
                $block_content,
                1
            );
            $block_content = preg_replace(
                '/<p class="service-row__arrow"><a href="[^"]+"[^>]*>→<\/a><\/p>/',
                '<p class="service-row__arrow" aria-hidden="true"><span>→</span></p>',
                $block_content,
                1
            );
        }
    }

    if ($block_name === 'core/image') {
        $block_content = str_replace('Y O H A K U / W O R K S P A C E', 'YOHAKU / WORKSPACE', $block_content);
        $block_content = str_replace('Y O H A K U / W O R K S', 'YOHAKU / WORKS', $block_content);
    }

    return $block_content;
}, 10, 2);

add_action('wp_head', function () {
    $description = '';
    if (is_singular() && !post_password_required()) {
        $description = has_excerpt()
            ? get_the_excerpt()
            : wp_trim_words(wp_strip_all_tags(strip_shortcodes(get_post_field('post_content', get_queried_object_id()))), 40, '');
    }
    if (!$description) {
        $description = get_bloginfo('description');
    }
    if ($description) {
        echo '<meta name="description" content="' . esc_attr($description) . '">' . "\n";
    }

    $title = wp_get_document_title();
    $url = is_singular() ? get_permalink() : home_url('/');
    $og_image = get_theme_file_uri('assets/og-image.svg');
    echo '<meta property="og:type" content="' . esc_attr(is_singular('post') ? 'article' : 'website') . '">' . "\n";
    echo '<meta property="og:title" content="' . esc_attr($title) . '">' . "\n";
    echo '<meta property="og:description" content="' . esc_attr($description) . '">' . "\n";
    echo '<meta property="og:url" content="' . esc_url($url) . '">' . "\n";
    echo '<meta property="og:image" content="' . esc_url($og_image) . '">' . "\n";
    echo '<meta property="og:image:type" content="image/svg+xml">' . "\n";
    echo '<meta name="twitter:card" content="summary_large_image">' . "\n";
    echo '<meta name="theme-color" content="#163d35">' . "\n";
    echo '<link rel="icon" type="image/svg+xml" href="' . esc_url(get_theme_file_uri('assets/favicon.svg')) . '">' . "\n";
}, 5);
