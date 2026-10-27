<?php
// Plain permalinks must keep separate generation identities without sending URL queries.
define('ABSPATH', __DIR__);
class WP_Post { public function __construct(public int $ID, public string $post_title = 'Same heading', public string $post_content = '<p>Original content</p>', public string $post_type = 'page', public string $post_status = 'publish', public string $post_name = '') {} }
function get_permalink($id) { return 'https://private.example/?page_id='.$id; }
function wp_parse_url($url,$component) { return parse_url($url,$component); }
function wp_strip_all_tags($text) { return strip_tags($text); }
function strip_shortcodes($text) { return $text; }
require dirname(__DIR__,2).'/includes/PostPresenter.php';
$current=['title'=>'','meta'=>''];
$a=BeepBeep_Titles\PostPresenter::envelope(new WP_Post(101),$current);
$b=BeepBeep_Titles\PostPresenter::envelope(new WP_Post(102),$current);
if($a['url']!=='/' || $b['url']!=='/' || $a['id']!=='101' || $b['id']!=='102')throw new RuntimeException('Plain permalink post identities collided');
if(str_contains(json_encode($a),'private.example') || str_contains(json_encode($a),'page_id='))throw new RuntimeException('Full URL or query leaked');
echo "PASS: identical plain permalink paths keep distinct post identities and omit host/query\n";
