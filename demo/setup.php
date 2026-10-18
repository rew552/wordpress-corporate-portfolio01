<?php
/**
 * Seed a fresh WordPress Playground instance with the portfolio demo content.
 *
 * This file is a trusted build/bootstrap script bundled into the Playground
 * Blueprint. It is not exposed as an HTTP endpoint and never processes request
 * globals. Re-running it does not overwrite existing authored pages.
 */
require_once '/wordpress/wp-load.php';
require_once ABSPATH . 'wp-admin/includes/image.php';

const YOHAKU_DEMO_SEED_VERSION = '1.2.0';

update_option('yohaku_demo_mode', 1);

/**
 * Create the editable primary Navigation entity once.
 */
function yohaku_demo_seed_primary_navigation(string $home): void {
    $navigation_posts = get_posts([
        'post_type' => 'wp_navigation',
        'post_status' => 'publish',
        'name' => 'primary-navigation',
        'numberposts' => 1,
        'suppress_filters' => false,
    ]);

    if ($navigation_posts) {
        return;
    }

    $navigation_blocks = [];
    foreach ([
        ['私たちについて', $home . '/about/'],
        ['サービス', $home . '/services/'],
        ['お知らせ', $home . '/news/'],
        ['会社概要', $home . '/company/'],
        ['お問い合わせ', $home . '/contact/'],
    ] as [$label, $url]) {
        $navigation_blocks[] = [
            'blockName' => 'core/navigation-link',
            'attrs' => [
                'label' => $label,
                'type' => 'custom',
                'url' => $url,
                'kind' => 'custom',
                'isTopLevelLink' => true,
            ],
            'innerBlocks' => [],
            'innerHTML' => '',
            'innerContent' => [],
        ];
    }

    $navigation_id = wp_insert_post([
        'post_type' => 'wp_navigation',
        'post_status' => 'publish',
        'post_name' => 'primary-navigation',
        'post_title' => 'メインナビゲーション',
        'post_content' => serialize_blocks($navigation_blocks),
    ], true);

    if (is_wp_error($navigation_id)) {
        throw new RuntimeException($navigation_id->get_error_message());
    }
}

/**
 * Add the bundled illustration to the media library and return its attachment ID.
 */
function yohaku_demo_seed_media(): int {
    $asset_path = get_theme_file_path('assets/news.png');
    $asset_bytes = file_get_contents($asset_path);

    if ($asset_bytes === false) {
        throw new RuntimeException('Could not read bundled demo image: ' . $asset_path);
    }

    $upload = wp_upload_bits('yohaku-workspace.png', null, $asset_bytes);
    if (!empty($upload['error'])) {
        throw new RuntimeException($upload['error']);
    }

    $media_id = wp_insert_attachment([
        'post_title' => '業務整理のオリジナル図版',
        'post_mime_type' => 'image/png',
        'post_status' => 'inherit',
    ], $upload['file'], 0, true);

    if (is_wp_error($media_id)) {
        throw new RuntimeException($media_id->get_error_message());
    }

    wp_update_attachment_metadata(
        $media_id,
        wp_generate_attachment_metadata($media_id, $upload['file'])
    );
    update_post_meta(
        $media_id,
        '_wp_attachment_image_alt',
        '仕事の仕組みを整えるイメージのオリジナル図版'
    );

    return (int) $media_id;
}

/**
 * Replace build-time content tokens with URLs from this Playground instance.
 */
function yohaku_demo_replace_tokens(string $content, array $tokens): string {
    return strtr($content, $tokens);
}

/**
 * Lock structural demo groups while keeping their inner content editable.
 */
function yohaku_demo_lock_structure(string $content): string {
    foreach (['section-header', 'service-row', 'case-grid', 'process-grid'] as $class_name) {
        $content = str_replace(
            '"className":"' . $class_name . '","layout"',
            '"className":"' . $class_name . '","lock":{"move":true,"remove":true},"layout"',
            $content
        );
    }

    return $content;
}

/**
 * Seed editable pages and return their IDs keyed by slug.
 */
function yohaku_demo_seed_pages(string $source, array $tokens): array {
    $pages = [
        'home' => 'ホーム',
        'about' => '私たちについて',
        'services' => 'サービス',
        'company' => '会社概要',
        'news' => 'お知らせ',
        'contact' => 'お問い合わせ',
        'resources' => '資料ダウンロード',
        'partners' => 'パートナー向け資料',
        'privacy' => 'プライバシーポリシー',
    ];

    $excerpts = [
        'home' => '業務の流れを見直し、必要なデジタルだけを取り入れる。仕事に余白をつくるための架空の業務改善パートナーです。',
        'about' => '現場の声を起点に、よく聴き、小さく試し、自分たちで続けられる仕組みをつくる。余白ワークスの考え方をご紹介します。',
        'services' => '業務の整理、仕組みの導入、定着の伴走。現状整理から運用までを段階に合わせて支援する3つのサービスです。',
        'company' => '自主制作ポートフォリオとして設定した、架空企業・余白ワークスの基本情報をご紹介します。',
        'news' => '架空企業・余白ワークスのお知らせです。WordPressの投稿機能とQuery Loopのデモとして更新できます。',
        'contact' => '相談内容がまとまっていない段階からでも。入力から完了状態まで試せる、保存・送信を行わないデモフォームです。',
        'resources' => '架空サービスの資料ダウンロード導線と、WordPressで管理するコンテンツ設計のデモです。',
        'partners' => 'パートナー向け情報を想定したパスワード保護ページのデモです。',
        'privacy' => '自主制作ポートフォリオにおけるデータ取り扱いと、デモフォームの仕様をご案内します。',
    ];

    $ids = [];
    foreach ($pages as $slug => $title) {
        $existing = get_page_by_path($slug);
        if ($existing) {
            $ids[$slug] = $existing->ID;
            continue;
        }

        $source_content = file_get_contents($source . '/content/' . $slug . '.html');
        if ($source_content === false) {
            throw new RuntimeException('Could not read demo page source: ' . $slug);
        }

        $data = [
            'post_type' => 'page',
            'post_author' => 1,
            'post_status' => 'publish',
            'post_name' => $slug,
            'post_title' => $title,
            'post_content' => yohaku_demo_lock_structure(
                yohaku_demo_replace_tokens($source_content, $tokens)
            ),
            'post_excerpt' => $excerpts[$slug]
                ?? ('架空企業・余白ワークスの自主制作ポートフォリオ。' . $title . 'をご紹介します。'),
        ];

        if ($slug === 'partners') {
            $data['post_password'] = 'yohaku-demo';
        }

        $page_id = wp_insert_post($data, true);
        if (is_wp_error($page_id)) {
            throw new RuntimeException($page_id->get_error_message());
        }

        $ids[$slug] = $page_id;
    }

    return $ids;
}

/**
 * Seed sample News posts. Existing slugs are left intact on a partial re-run.
 */
function yohaku_demo_seed_posts(string $source, array $tokens, int $media_id): void {
    $posts_json = file_get_contents($source . '/posts.json');
    if ($posts_json === false) {
        throw new RuntimeException('Could not read demo posts.json');
    }

    $posts = json_decode($posts_json, true, 512, JSON_THROW_ON_ERROR);
    foreach ($posts as $post) {
        if (get_page_by_path($post['slug'], OBJECT, 'post')) {
            continue;
        }

        $term = term_exists($post['category'], 'category');
        if (!$term) {
            $term = wp_insert_term($post['category'], 'category');
        }
        if (is_wp_error($term)) {
            throw new RuntimeException($term->get_error_message());
        }

        $post_id = wp_insert_post([
            'post_type' => 'post',
            'post_author' => 1,
            'post_status' => 'publish',
            'post_title' => $post['title'],
            'post_name' => $post['slug'],
            'post_date' => $post['date'],
            'post_content' => yohaku_demo_replace_tokens($post['content'], $tokens),
            'post_excerpt' => $post['excerpt'],
            'post_category' => [(int) $term['term_id']],
        ], true);

        if (is_wp_error($post_id)) {
            throw new RuntimeException($post_id->get_error_message());
        }

        set_post_thumbnail($post_id, $media_id);
    }
}

/**
 * Configure WordPress settings expected by the disposable demo.
 */
function yohaku_demo_configure_site(array $page_ids): void {
    update_option('blogname', '余白ワークス');
    update_option('blogdescription', '仕事を整え、人が活きる余白をつくる。｜自主制作・架空企業');
    update_option('show_on_front', 'page');
    update_option('page_on_front', $page_ids['home']);
    update_option('page_for_posts', $page_ids['news']);
    update_option('wp_page_for_privacy_policy', $page_ids['privacy']);
    update_option('timezone_string', 'Asia/Tokyo');
    update_option('date_format', 'Y.m.d');
    update_option('default_comment_status', 'closed');
    update_option('default_ping_status', 'closed');
    update_option('posts_per_page', 6);
    update_option('blog_public', 0);
    update_option('WPLANG', 'ja');
    update_option('show_avatars', 0);
    update_user_meta(1, 'show_admin_bar_front', 'false');

    global $wp_rewrite;
    $wp_rewrite->set_permalink_structure('/%postname%/');
}

/**
 * Remove content created by a vanilla WordPress installation.
 */
function yohaku_demo_delete_default_content(): void {
    foreach (['hello-world', 'sample-page', 'privacy-policy'] as $slug) {
        $default = get_page_by_path($slug, OBJECT, ['post', 'page']);
        if ($default) {
            wp_delete_post($default->ID, true);
        }
    }
}

$home = untrailingslashit(home_url());
yohaku_demo_seed_primary_navigation($home);

if (get_option('yohaku_seed_version') === YOHAKU_DEMO_SEED_VERSION) {
    echo "Already seeded.\n";
    return;
}

$source = '/wordpress/wp-content/yohaku-demo';
$media_id = yohaku_demo_seed_media();
$tokens = [
    '{{ASSET}}' => get_theme_file_uri('assets'),
    '{{HOME}}' => $home,
    '{{ADMIN}}' => trailingslashit(admin_url()),
    '{{MEDIA}}' => (string) wp_get_attachment_url($media_id),
];

$page_ids = yohaku_demo_seed_pages($source, $tokens);
yohaku_demo_seed_posts($source, $tokens, $media_id);
yohaku_demo_configure_site($page_ids);
yohaku_demo_delete_default_content();
flush_rewrite_rules();

update_option('yohaku_seed_version', YOHAKU_DEMO_SEED_VERSION);
echo "Yohaku demo seeded.\n";
