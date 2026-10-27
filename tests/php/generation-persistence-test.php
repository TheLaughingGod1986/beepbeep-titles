<?php
namespace BeepBeep_Titles\Api {
    class Client {
        public function generate( ...$args ) { return [ 'title' => 'Generated title', 'meta' => 'Generated description' ]; }
        public function poll_job( $id ) { return [ 'status' => 'completed', 'items' => [ [ 'id' => 1, 'status' => 'completed', 'title' => 'Generated title', 'meta' => 'Generated description' ] ] ]; }
    }
}
namespace BeepBeep_Titles {
    class PostPresenter {
        public static function envelope( $post ) { return []; }
        public static function permalink_path( $post ) { return '/test'; }
        public static function section_for( $post ) { return 'post'; }
    }
    class ActivityLog { public static function record( ...$args ) { $GLOBALS['activity_count']++; } }
}
namespace OptiAI\Core\Scan {
    class Schema { public static function items_table_exists() { return false; } }
    class Scan_Repository { public function __construct( ...$args ) {} public function mark_optimised( ...$args ) {} }
    class History_Repository { public function __construct( ...$args ) {} public function record( ...$args ) {} }
}
namespace BeepBeep_Titles\Scoring { class Metadata_Scoring_Engine { public function run() {} } }
namespace {
    require __DIR__ . '/first-value-test.php';
    define( 'HOUR_IN_SECONDS', 3600 );
    define( 'DAY_IN_SECONDS', 86400 );
    $GLOBALS['transients'] = [];
    function get_bloginfo( $key ) { return 'Test'; }
    function get_post( $id ) { return (object) [ 'ID' => $id, 'post_type' => 'post' ]; }
    function current_user_can( ...$args ) { return true; }
    function get_transient( $key ) { return $GLOBALS['transients'][$key] ?? false; }
    function set_transient( $key, $value, $ttl = 0 ) { $GLOBALS['transients'][$key] = $value; }
    function delete_transient( $key ) { unset( $GLOBALS['transients'][$key] ); }
    function delete_option( $key ) { unset( $GLOBALS['options'][$key] ); }
    function wp_json_encode( $value ) { return json_encode( $value ); }
    function __( $s, $domain = '' ) { return $s; }
    function is_wp_error( $v ) { return $v instanceof WP_Error; }
    class WP_Error {}
    class WP_REST_Request implements ArrayAccess {
        public function get_param( $k ) { return $k === 'post_id' ? 1 : null; }
        public function offsetExists( mixed $k ): bool { return true; }
        public function offsetGet( mixed $k ): mixed { return 'job-test'; }
        public function offsetSet( mixed $k, mixed $v ): void {}
        public function offsetUnset( mixed $k ): void {}
    }
    class WP_REST_Response { public function __construct( public $data, public $status = 200 ) {} }
    require dirname( __DIR__, 2 ) . '/includes/Rest/GenerateController.php';
    $controller = new BeepBeep_Titles\Rest\GenerateController( new BeepBeep_Titles\Api\Client() );
    $GLOBALS['options'] = [ 'beepti_telemetry_consent' => 'yes', 'beepti_seo_plugin' => 'fallback' ];
    $GLOBALS['events'] = [];
    $GLOBALS['metadata'] = [];
    $GLOBALS['activity_count'] = 0;
    $GLOBALS['fail_write'] = true;
    $response = $controller->generate( new WP_REST_Request() );
    check( 500 === $response->status, 'single generation rejects failed local write' );
    check( 0 === $GLOBALS['activity_count'] && ! get_option( 'beepti_first_successful_generation_at' ), 'failed single write has no activity or first value' );
    $GLOBALS['transients']['beepti_job_job-test'] = [ 1 ];
    $response = $controller->poll_job( new WP_REST_Request() );
    check( true === $response->data['persistence_failed'], 'bulk generation reports persistence failure' );
    check( 'failed' === $response->data['items'][0]['status'], 'unpersisted bulk item is not successful' );
    check( [ 1 ] === get_transient( 'beepti_job_job-test' ), 'bulk write failure preserves mapping for safe retry' );
    check( ! get_option( 'beepti_first_successful_generation_at' ), 'bulk write failure does not claim first value' );
    $GLOBALS['fail_write'] = false;
    $controller->poll_job( new WP_REST_Request() );
    check( 1 === $GLOBALS['activity_count'], 'retry saves once after write recovers' );
    check( (bool) get_option( 'beepti_first_successful_generation_at' ), 'persisted retry claims first value' );
    $controller->poll_job( new WP_REST_Request() );
    check( 1 === $GLOBALS['activity_count'], 'repeated terminal poll never rewrites or duplicates activity' );
}
