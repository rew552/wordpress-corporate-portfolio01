<?php
/**
 * Plugin Name: Yohaku Portfolio Demo
 * Description: WordPress Playground向けのCMS体験ガイドと、保存・送信を行わないデモフォームを提供します。
 * Version: 1.3.0
 * License: GPL-2.0-or-later
 */
if (!defined('ABSPATH')) {
    exit;
}

const YOHAKU_DEMO_VERSION = '1.3.0';

/**
 * Whether Playground demo affordances should be visible.
 */
function yohaku_demo_is_enabled(): bool {
    return (bool) get_option('yohaku_demo_mode');
}

/**
 * Demo editor affordances are only useful to users who can edit site content.
 */
function yohaku_demo_can_edit_content(): bool {
    return current_user_can('edit_pages');
}

/**
 * Return the seeded primary navigation entity when it exists.
 */
function yohaku_demo_primary_navigation(): ?WP_Post {
    $posts = get_posts([
        'post_type' => 'wp_navigation',
        'post_status' => 'publish',
        'name' => 'primary-navigation',
        'numberposts' => 1,
        'suppress_filters' => false,
    ]);

    return $posts ? $posts[0] : null;
}

/**
 * Use the seeded Navigation post if the block theme needs a fallback.
 *
 * @param array $fallback_blocks Core-generated fallback navigation blocks.
 * @return array
 */
function yohaku_demo_navigation_fallback(array $fallback_blocks): array {
    if (!yohaku_demo_is_enabled()) {
        return $fallback_blocks;
    }

    $navigation = yohaku_demo_primary_navigation();
    if (!$navigation || !$navigation->post_content) {
        return $fallback_blocks;
    }

    $blocks = array_values(array_filter(
        parse_blocks($navigation->post_content),
        static fn(array $block): bool => !empty($block['blockName'])
    ));

    return $blocks ?: $fallback_blocks;
}
add_filter('block_core_navigation_render_fallback', 'yohaku_demo_navigation_fallback');

/**
 * Load the public demo-bar styles only in demo mode.
 */
function yohaku_demo_enqueue_public_assets(): void {
    if (!yohaku_demo_is_enabled()) {
        return;
    }

    wp_enqueue_style(
        'yohaku-portfolio-demo',
        plugins_url('demo.css', __FILE__),
        [],
        YOHAKU_DEMO_VERSION
    );
}
add_action('wp_enqueue_scripts', 'yohaku_demo_enqueue_public_assets');

/**
 * Load the dashboard guide styles for editors using the Playground demo.
 */
function yohaku_demo_enqueue_admin_assets(): void {
    if (!yohaku_demo_is_enabled() || !yohaku_demo_can_edit_content()) {
        return;
    }

    wp_enqueue_style(
        'yohaku-portfolio-demo-admin',
        plugins_url('demo.css', __FILE__),
        [],
        YOHAKU_DEMO_VERSION
    );
}
add_action('admin_enqueue_scripts', 'yohaku_demo_enqueue_admin_assets');

/**
 * Render the public portfolio-demo bar.
 */
function yohaku_demo_render_bar(): void {
    if (!yohaku_demo_is_enabled()) {
        return;
    }
    ?>
    <aside class="portfolio-demo-bar" aria-label="ポートフォリオデモ">
        <div class="portfolio-demo-bar__inner">
            <div class="portfolio-demo-bar__label">PORTFOLIO DEMO</div>
            <p class="portfolio-demo-bar__message">このサイトはWordPressの管理画面から実際に編集できます。</p>
            <a class="portfolio-demo-bar__link" href="<?php echo esc_url(home_url('/#cms-demo')); ?>">編集できる箇所を見る</a>
            <a class="portfolio-demo-bar__button" href="<?php echo esc_url(admin_url()); ?>">管理画面を試す <span aria-hidden="true">↗</span></a>
        </div>
    </aside>
    <?php
}
add_action('wp_body_open', 'yohaku_demo_render_bar', 1);

/**
 * Render the dashboard guide widget.
 */
function yohaku_demo_render_dashboard_widget(): void {
    $front_id = (int) get_option('page_on_front');
    $front_edit = $front_id
        ? get_edit_post_link($front_id, '')
        : admin_url('edit.php?post_type=page');
    ?>
    <div class="yohaku-demo-dashboard">
        <p class="yohaku-demo-dashboard__lead">公開サイトを見るだけでなく、文章・画像・投稿・共通デザインまで編集できます。変更はこのPlayground環境だけに反映されます。</p>
        <div class="yohaku-demo-dashboard__grid">
            <a href="<?php echo esc_url($front_edit); ?>"><strong>TOPページを編集</strong><span>コピーやセクションをブロックエディターで変更</span></a>
            <a href="<?php echo esc_url(admin_url('post-new.php')); ?>"><strong>お知らせを追加</strong><span>投稿すると一覧へ自動反映</span></a>
            <a href="<?php echo esc_url(admin_url('upload.php')); ?>"><strong>画像を差し替え</strong><span>メディアから画像を追加・置換</span></a>
            <a href="<?php echo esc_url(admin_url('site-editor.php?path=/navigation')); ?>"><strong>ナビゲーションを編集</strong><span>WordPress標準のNavigationからメニューを変更</span></a>
            <a href="<?php echo esc_url(admin_url('site-editor.php')); ?>"><strong>サイト全体を編集</strong><span>ヘッダー・フッター・スタイルを確認</span></a>
        </div>
        <p class="yohaku-demo-dashboard__actions"><a class="button button-primary" href="<?php echo esc_url(home_url('/')); ?>">公開サイトを確認する ↗</a></p>
    </div>
    <?php
}

/**
 * Register the editor-facing dashboard guide.
 */
function yohaku_demo_register_dashboard_widget(): void {
    if (!yohaku_demo_is_enabled() || !yohaku_demo_can_edit_content()) {
        return;
    }

    wp_add_dashboard_widget(
        'yohaku_demo_guide',
        'このデモで試せること',
        'yohaku_demo_render_dashboard_widget'
    );
}
add_action('wp_dashboard_setup', 'yohaku_demo_register_dashboard_widget');

/**
 * Add a convenient public-site link while an editor is in wp-admin.
 */
function yohaku_demo_add_admin_bar_link(WP_Admin_Bar $admin_bar): void {
    if (!yohaku_demo_is_enabled() || !is_admin() || !yohaku_demo_can_edit_content()) {
        return;
    }

    $admin_bar->add_node([
        'id' => 'yohaku-view-site',
        'title' => '公開サイトを確認',
        'href' => home_url('/'),
        'meta' => [
            'target' => '_blank',
            'rel' => 'noopener',
        ],
    ]);
}
add_action('admin_bar_menu', 'yohaku_demo_add_admin_bar_link', 90);

/**
 * Render the intentionally non-submitting contact-form demo.
 *
 * There is deliberately no nonce or server-side request handler: the submit
 * event is cancelled in form.js, no request endpoint is registered, and input
 * is never persisted or transmitted.
 */
function yohaku_demo_render_form(): string {
    wp_enqueue_script(
        'yohaku-demo-form',
        plugins_url('form.js', __FILE__),
        [],
        YOHAKU_DEMO_VERSION,
        true
    );

    ob_start();
    ?>
    <form class="demo-form" aria-label="デモお問い合わせ" autocomplete="off">
        <p>必須の項目を入力してください。</p>
        <label>お名前<span class="required">必須</span><input type="text" required maxlength="80" autocomplete="off" placeholder="デモ 太郎"></label>
        <label>メールアドレス<span class="required">必須</span><input type="email" required maxlength="254" autocomplete="off" placeholder="demo@example.com"></label>
        <label>ご相談の種類<span class="required">必須</span><select required><option value="">選択してください</option><option>業務の整理</option><option>仕組みの導入</option><option>定着の伴走</option><option>その他</option></select></label>
        <label>ご相談内容<span class="required">必須</span><textarea required minlength="10" maxlength="2000" placeholder="10文字以上で、テスト用の内容を入力してください。"></textarea></label>
        <label><input type="checkbox" required>保存・送信されないデモであることに同意します</label>
        <p><a href="<?php echo esc_url(home_url('/privacy/')); ?>">プライバシーポリシーを確認する</a></p>
        <button type="submit" disabled>デモ送信を試す →</button>
        <noscript><p>デモ操作にはJavaScriptを有効にしてください。送信機能はありません。</p></noscript>
        <div class="form-success" role="status" tabindex="-1" hidden></div>
    </form>
    <?php

    return (string) ob_get_clean();
}
add_shortcode('yohaku_demo_form', 'yohaku_demo_render_form');
