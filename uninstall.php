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

/*
 * Wrapped in an immediately-invoked closure so the working variables stay in
 * function scope (the WordPress.org coding standards flag bare globals at the
 * file level even when they carry the plugin prefix).
 */
( static function (): void {
    global $wpdb;

    // Read the delete-on-uninstall preference before we wipe options.
    $settings   = get_option( 'bbt_settings', [] );
    $delete_all = is_array( $settings ) && ! empty( $settings['delete_on_uninstall'] );

    // 1. Options.
    $options = [
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
    foreach ( $options as $option ) {
        delete_option( $option );
    }

    // 2. Transients (stats, scan lock, deferred notices, job mappings).
    // phpcs:ignore WordPress.DB.DirectDatabaseQuery, WordPress.DB.PreparedSQL.InterpolatedNotPrepared, PluginCheck.Security.DirectDB.UnescapedDBParameter -- {$wpdb->options} is a core table identifier; static LIKE patterns, no user input.
    $wpdb->query(
        "DELETE FROM {$wpdb->options}
         WHERE option_name LIKE '_transient_bbt_%'
            OR option_name LIKE '_transient_timeout_bbt_%'"
    );

    // 3. Legacy usage table, if it somehow survived.
    // phpcs:ignore WordPress.DB.DirectDatabaseQuery, WordPress.DB.PreparedSQL.InterpolatedNotPrepared, WordPress.DB.PreparedSQL.NotPrepared, PluginCheck.Security.DirectDB.UnescapedDBParameter -- prefix-built identifier; static DDL, no user input.
    $wpdb->query( "DROP TABLE IF EXISTS {$wpdb->prefix}bbt_usage_log" );

    // 4. Fallback-mode post meta — only when the user asked for a full wipe.
    if ( $delete_all ) {
        delete_post_meta_by_key( '_bbt_seo_title' );
        delete_post_meta_by_key( '_bbt_meta_description' );
        delete_post_meta_by_key( '_bbt_monthly_traffic' );
    }
} )();
