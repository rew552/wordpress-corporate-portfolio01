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
    if (is_singular() && !post_password_required()) {
        $description = has_excerpt() ? get_the_excerpt() : wp_trim_words(wp_strip_all_tags(strip_shortcodes(get_post_field('post_content', get_queried_object_id()))), 40, '');
        if ($description) { echo '<meta name="description" content="' . esc_attr($description) . '">' . "\n"; }
    }
});
