<?php
/**
 * Plugin Name: Yohaku Demo Form
 * Description: 保存・送信を行わないPlayground専用フォーム。実運用の問い合わせ受付には使用しません。
 * Version: 1.0.0
 * License: GPL-2.0-or-later
 */
if (!defined('ABSPATH')) { exit; }
add_shortcode('yohaku_demo_form', function () {
    wp_enqueue_script('yohaku-demo-form', plugins_url('form.js', __FILE__), [], '1.0.0', true);
    ob_start(); ?>
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
    <?php return ob_get_clean();
});
