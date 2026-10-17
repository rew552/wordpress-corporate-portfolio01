<?php
/** Theme presentation only. Demo behavior lives in a separate plugin. */
if (!defined('ABSPATH')) { exit; }

add_action('after_setup_theme', function () {
    add_theme_support('editor-styles');
    add_editor_style('assets/site.css');
    load_theme_textdomain('yohaku', get_template_directory() . '/languages');
});

add_action('wp_enqueue_scripts', function () {
    wp_enqueue_style('yohaku-site', get_theme_file_uri('assets/site.css'), [], wp_get_theme()->get('Version'));
});

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
