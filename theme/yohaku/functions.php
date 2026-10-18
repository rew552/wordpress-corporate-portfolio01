<?php
/**
 * Yohaku theme presentation helpers.
 *
 * Demo-only behavior belongs to the yohaku-demo-form plugin. This file is
 * intentionally limited to theme setup, front-end assets and rendered markup
 * adjustments that improve presentation or semantics.
 */
if (!defined('ABSPATH')) {
    exit;
}

/**
 * Register editor-facing theme features.
 */
function yohaku_theme_setup(): void {
    add_theme_support('editor-styles');
    add_editor_style('assets/site.css');
    add_editor_style('assets/quality-polish.css');
    add_editor_style('assets/layout-system.css');
    load_theme_textdomain('yohaku', get_template_directory() . '/languages');
}
add_action('after_setup_theme', 'yohaku_theme_setup');

/**
 * Load the presentation layers in the same order as the editor styles.
 */
function yohaku_enqueue_theme_assets(): void {
    $version = wp_get_theme()->get('Version');

    wp_enqueue_style('yohaku-site', get_theme_file_uri('assets/site.css'), [], $version);
    wp_enqueue_style(
        'yohaku-quality-polish',
        get_theme_file_uri('assets/quality-polish.css'),
        ['yohaku-site'],
        $version
    );
    wp_enqueue_style(
        'yohaku-layout-system',
        get_theme_file_uri('assets/layout-system.css'),
        ['yohaku-quality-polish'],
        $version
    );
}
add_action('wp_enqueue_scripts', 'yohaku_enqueue_theme_assets');

/**
 * Print a keyboard-accessible skip link immediately after the body opens.
 */
function yohaku_render_skip_link(): void {
    echo '<a class="skip-link" href="#main-content">' . esc_html__('本文へスキップ', 'yohaku') . '</a>';
}
add_action('wp_body_open', 'yohaku_render_skip_link');

/**
 * Add a stable target for the skip link to the first rendered main element.
 */
function yohaku_add_main_landmark_id(string $block_content): string {
    if (class_exists('WP_HTML_Tag_Processor')) {
        $processor = new WP_HTML_Tag_Processor($block_content);
        if ($processor->next_tag('main') && !$processor->get_attribute('id')) {
            $processor->set_attribute('id', 'main-content');
        }
        return $processor->get_updated_html();
    }

    return (string) preg_replace('/<main\b/', '<main id="main-content"', $block_content, 1);
}

/**
 * Make the service title the primary link and leave the arrow decorative.
 *
 * The source block remains editable in Gutenberg. This targeted transformation
 * only adjusts the final rendered HTML for a more useful interaction target.
 */
function yohaku_link_service_row_title(string $block_content): string {
    if (str_contains($block_content, 'service-row__title-link')) {
        return $block_content;
    }

    if (!preg_match('/<p class="service-row__arrow"><a href="([^"]+)"[^>]*>→<\/a><\/p>/', $block_content, $match)) {
        return $block_content;
    }

    $href = esc_url($match[1]);
    $block_content = (string) preg_replace(
        '/<h3([^>]*)>(.*?)<\/h3>/s',
        '<h3$1><a class="service-row__title-link" href="' . $href . '">$2</a></h3>',
        $block_content,
        1
    );

    return (string) preg_replace(
        '/<p class="service-row__arrow"><a href="[^"]+"[^>]*>→<\/a><\/p>/',
        '<p class="service-row__arrow" aria-hidden="true"><span>→</span></p>',
        $block_content,
        1
    );
}

/**
 * Normalize presentation-only labels embedded in bundled illustration markup.
 */
function yohaku_normalize_image_labels(string $block_content): string {
    return str_replace(
        ['Y O H A K U / W O R K S P A C E', 'Y O H A K U / W O R K S'],
        ['YOHAKU / WORKSPACE', 'YOHAKU / WORKS'],
        $block_content
    );
}

/**
 * Improve rendered block semantics without moving authored content into PHP.
 *
 * @param string $block_content Rendered block HTML.
 * @param array  $block         Parsed block data.
 */
function yohaku_filter_rendered_block(string $block_content, array $block): string {
    $block_name = $block['blockName'] ?? '';
    $attrs = $block['attrs'] ?? [];

    if ($block_name === 'core/group' && ($attrs['tagName'] ?? '') === 'main' && !str_contains($block_content, 'id="main-content"')) {
        $block_content = yohaku_add_main_landmark_id($block_content);
    }

    if ($block_name === 'core/group' && str_contains((string) ($attrs['className'] ?? ''), 'service-row')) {
        $block_content = yohaku_link_service_row_title($block_content);
    }

    if ($block_name === 'core/image') {
        $block_content = yohaku_normalize_image_labels($block_content);
    }

    return $block_content;
}
add_filter('render_block', 'yohaku_filter_rendered_block', 10, 2);

/**
 * Build a concise meta description from the current page or site tagline.
 */
function yohaku_get_meta_description(): string {
    $description = '';

    if (is_singular() && !post_password_required()) {
        $description = has_excerpt()
            ? get_the_excerpt()
            : wp_trim_words(
                wp_strip_all_tags(strip_shortcodes(get_post_field('post_content', get_queried_object_id()))),
                40,
                ''
            );
    }

    return $description ?: get_bloginfo('description');
}

/**
 * Print minimal metadata for the standalone portfolio demo.
 */
function yohaku_render_document_metadata(): void {
    $description = yohaku_get_meta_description();
    $title = wp_get_document_title();
    $url = is_singular() ? get_permalink() : home_url('/');
    $og_image = get_theme_file_uri('assets/og-image.svg');

    if ($description) {
        echo '<meta name="description" content="' . esc_attr($description) . '">' . "\n";
    }

    echo '<meta property="og:type" content="' . esc_attr(is_singular('post') ? 'article' : 'website') . '">' . "\n";
    echo '<meta property="og:title" content="' . esc_attr($title) . '">' . "\n";
    echo '<meta property="og:description" content="' . esc_attr($description) . '">' . "\n";
    echo '<meta property="og:url" content="' . esc_url($url) . '">' . "\n";
    echo '<meta property="og:image" content="' . esc_url($og_image) . '">' . "\n";
    echo '<meta property="og:image:type" content="image/svg+xml">' . "\n";
    echo '<meta name="twitter:card" content="summary_large_image">' . "\n";
    echo '<meta name="theme-color" content="#163d35">' . "\n";
    echo '<link rel="icon" type="image/svg+xml" href="' . esc_url(get_theme_file_uri('assets/favicon.svg')) . '">' . "\n";
}
add_action('wp_head', 'yohaku_render_document_metadata', 5);
