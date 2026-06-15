<?php
/**
 * Uninstall cleanup for BeepBeep Titles.
 *
 * Removes every option + transient the plugin created. If the user opted in
 * via the "Delete data on uninstall" setting, also removes the fallback-mode
 * post meta we wrote. SEO-plugin keys (Yoast / Rank Math / AIOSEO) are never
 * touched — that data predates us and the user may keep those plugins.
 *
 * @package BeepBeep_Titles
 */

defined( 'WP_UNINSTALL_PLUGIN' ) || exit;

global $wpdb;

// Read the delete-on-uninstall preference before we wipe options.
$bbt_settings   = get_option( 'bbt_settings', [] );
$bbt_delete_all = is_array( $bbt_settings ) && ! empty( $bbt_settings['delete_on_uninstall'] );

// 1. Options.
$bbt_options = [
    'bbt_license_key',
    'bbt_account_email',
    'bbt_install_hash',
    'bbt_site_fingerprint',
    'bbt_settings',
    'bbt_seo_plugin',
    'bbt_last_scan',
    'bbt_activity',
    'bbt_db_version',
];
foreach ( $bbt_options as $bbt_option ) {
    delete_option( $bbt_option );
}

// 2. Transients (stats, scan lock, deferred notices, job mappings).
// phpcs:ignore WordPress.DB.DirectDatabaseQuery
$wpdb->query(
    "DELETE FROM {$wpdb->options}
     WHERE option_name LIKE '_transient_bbt_%'
        OR option_name LIKE '_transient_timeout_bbt_%'"
);

// 3. Legacy usage table, if it somehow survived.
// phpcs:ignore WordPress.DB.DirectDatabaseQuery, WordPress.DB.PreparedSQL
$wpdb->query( "DROP TABLE IF EXISTS {$wpdb->prefix}bbt_usage_log" );

// 4. Fallback-mode post meta — only when the user asked for a full wipe.
if ( $bbt_delete_all ) {
    delete_post_meta_by_key( '_bbt_seo_title' );
    delete_post_meta_by_key( '_bbt_meta_description' );
    delete_post_meta_by_key( '_bbt_monthly_traffic' );
}
