<?php
/** Fresh Playground-only seed. Does not overwrite existing authored pages on re-run. */
require_once '/wordpress/wp-load.php';
require_once ABSPATH . 'wp-admin/includes/image.php';
update_option('yohaku_demo_mode', 1);

$home = untrailingslashit(home_url());
$navigation_posts = get_posts([
    'post_type' => 'wp_navigation',
    'post_status' => 'publish',
    'name' => 'primary-navigation',
    'numberposts' => 1,
]);
if (!$navigation_posts) {
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
    if (is_wp_error($navigation_id)) { throw new RuntimeException($navigation_id->get_error_message()); }
}

if (get_option('yohaku_seed_version') === '1.1.0') { echo "Already seeded.\n"; return; }
update_option('timezone_string', 'Asia/Tokyo');
update_option('show_avatars', 0);
update_user_meta(1, 'show_admin_bar_front', 'false');
update_option('default_comment_status', 'closed');
update_option('default_ping_status', 'closed');
$source = '/wordpress/wp-content/yohaku-demo';
$asset = get_theme_file_uri('assets');
$admin = trailingslashit(admin_url());
$upload = wp_upload_bits('yohaku-workspace.png', null, file_get_contents(get_theme_file_path('assets/news.png')));
if (!empty($upload['error'])) { throw new RuntimeException($upload['error']); }
$media = wp_insert_attachment(['post_title'=>'業務整理のオリジナル図版', 'post_mime_type'=>'image/png','post_status'=>'inherit'], $upload['file'], 0, true);
if (is_wp_error($media)) { throw new RuntimeException($media->get_error_message()); }
wp_update_attachment_metadata($media, wp_generate_attachment_metadata($media, $upload['file']));
update_post_meta($media, '_wp_attachment_image_alt', '仕事の仕組みを整えるイメージのオリジナル図版');
$replace = function ($text) use ($asset, $home, $admin, $media) { return strtr($text, ['{{ASSET}}'=>$asset, '{{HOME}}'=>$home, '{{ADMIN}}'=>$admin, '{{MEDIA}}'=>wp_get_attachment_url($media)]); };
$protect_structure = function ($text) {
    foreach (['section-header', 'service-row', 'case-grid', 'process-grid'] as $class_name) {
        $text = str_replace(
            '"className":"' . $class_name . '","layout"',
            '"className":"' . $class_name . '","lock":{"move":true,"remove":true},"layout"',
            $text
        );
    }
    return $text;
};
$pages = ['home'=>'ホーム','about'=>'私たちについて','services'=>'サービス','company'=>'会社概要','news'=>'お知らせ','contact'=>'お問い合わせ','resources'=>'資料ダウンロード','partners'=>'パートナー向け資料','privacy'=>'プライバシーポリシー'];
$page_excerpts = [
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
foreach ($pages as $slug=>$title) {
    $existing = get_page_by_path($slug);
    if ($existing) { $ids[$slug] = $existing->ID; continue; }
    $source_content = file_get_contents($source . '/content/' . $slug . '.html');
    $data = ['post_type'=>'page','post_author'=>1,'post_status'=>'publish','post_name'=>$slug,'post_title'=>$title,'post_content'=>$protect_structure($replace($source_content)),'post_excerpt'=>$page_excerpts[$slug] ?? ('架空企業・余白ワークスの自主制作ポートフォリオ。' . $title . 'をご紹介します。')];
    if ($slug === 'partners') { $data['post_password'] = 'yohaku-demo'; }
    $id = wp_insert_post($data, true);
    if (is_wp_error($id)) { throw new RuntimeException($id->get_error_message()); }
    $ids[$slug] = $id;
}
foreach (json_decode(file_get_contents($source . '/posts.json'), true) as $post) {
    $term = term_exists($post['category'], 'category');
    if (!$term) { $term = wp_insert_term($post['category'], 'category'); }
    if (is_wp_error($term)) { throw new RuntimeException($term->get_error_message()); }
    $id = wp_insert_post(['post_type'=>'post','post_author'=>1,'post_status'=>'publish','post_title'=>$post['title'],'post_name'=>$post['slug'],'post_date'=>$post['date'],'post_content'=>$replace($post['content']),'post_excerpt'=>$post['excerpt'],'post_category'=>[(int)$term['term_id']]], true);
    if (is_wp_error($id)) { throw new RuntimeException($id->get_error_message()); }
    set_post_thumbnail($id, $media);
}
update_option('blogname','余白ワークス');
update_option('blogdescription','仕事を整え、人が活きる余白をつくる。｜自主制作・架空企業');
update_option('show_on_front','page');
update_option('page_on_front',$ids['home']);
update_option('page_for_posts',$ids['news']);
update_option('wp_page_for_privacy_policy',$ids['privacy']);
global $wp_rewrite;
$wp_rewrite->set_permalink_structure('/%postname%/');
update_option('timezone_string','Asia/Tokyo');
update_option('date_format','Y.m.d');
update_option('default_comment_status','closed');
update_option('default_ping_status','closed');
update_option('posts_per_page',6);
update_option('blog_public',0);
update_option('WPLANG','ja');
foreach (['hello-world','sample-page','privacy-policy'] as $slug) {
    $default = get_page_by_path($slug, OBJECT, ['post','page']);
    if ($default) { wp_delete_post($default->ID, true); }
}
flush_rewrite_rules();
update_option('yohaku_seed_version','1.1.0');
echo "Yohaku demo seeded.\n";
