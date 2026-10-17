<?php
/** Fresh Playground-only seed. Does not overwrite existing authored pages on re-run. */
require_once '/wordpress/wp-load.php';
require_once ABSPATH . 'wp-admin/includes/image.php';
if (get_option('yohaku_seed_version') === '1.0.0') { echo "Already seeded.\n"; return; }
update_option('timezone_string', 'Asia/Tokyo');
update_option('show_avatars', 0);
update_user_meta(1, 'show_admin_bar_front', 'false');
update_option('default_comment_status', 'closed');
update_option('default_ping_status', 'closed');
$source = '/wordpress/wp-content/yohaku-demo';
$asset = get_theme_file_uri('assets');
$home = untrailingslashit(home_url());
$upload = wp_upload_bits('yohaku-workspace.png', null, file_get_contents(get_theme_file_path('assets/news.png')));
if (!empty($upload['error'])) { throw new RuntimeException($upload['error']); }
$media = wp_insert_attachment(['post_title'=>'業務整理のオリジナル図版', 'post_mime_type'=>'image/png','post_status'=>'inherit'], $upload['file'], 0, true);
if (is_wp_error($media)) { throw new RuntimeException($media->get_error_message()); }
wp_update_attachment_metadata($media, wp_generate_attachment_metadata($media, $upload['file']));
update_post_meta($media, '_wp_attachment_image_alt', '仕事の仕組みを整えるイメージのオリジナル図版');
$replace = function ($text) use ($asset, $home, $media) { return strtr($text, ['{{ASSET}}'=>$asset, '{{HOME}}'=>$home, '{{MEDIA}}'=>wp_get_attachment_url($media)]); };
$pages = ['home'=>'ホーム','about'=>'私たちについて','services'=>'サービス','company'=>'会社概要','news'=>'お知らせ','contact'=>'お問い合わせ','resources'=>'資料ダウンロード','partners'=>'パートナー向け資料','privacy'=>'プライバシーポリシー'];
$ids = [];
foreach ($pages as $slug=>$title) {
    $existing = get_page_by_path($slug);
    if ($existing) { $ids[$slug] = $existing->ID; continue; }
    $data = ['post_type'=>'page','post_author'=>1,'post_status'=>'publish','post_name'=>$slug,'post_title'=>$title,'post_content'=>$replace(file_get_contents($source . '/content/' . $slug . '.html')),'post_excerpt'=>'架空企業・余白ワークスの自主制作ポートフォリオ。' . $title . 'をご紹介します。'];
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
update_option('blog_public',0); // Demo should not be indexed.
update_option('WPLANG','ja');
foreach (['hello-world','sample-page','privacy-policy'] as $slug) {
    $default = get_page_by_path($slug, OBJECT, ['post','page']);
    if ($default) { wp_delete_post($default->ID, true); }
}
flush_rewrite_rules();
update_option('yohaku_seed_version','1.0.0');
echo "Yohaku demo seeded.\n";
