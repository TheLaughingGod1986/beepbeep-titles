<?php
/**
 * Records and reads the optimisation undo log — one row per successful AI
 * fix, capturing the value it replaced so a user can revert it, and the
 * score delta so "Recent Progress" can show real before/after numbers.
 *
 * @package OptiAI_Core
 */

namespace OptiAI\Core\Scan;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class History_Repository {

	/** @var string Module slug this repository is scoped to. */
	private $module;

	/**
	 * @param string $module Module slug.
	 */
	public function __construct( $module ) {
		$this->module = (string) $module;
	}

	/**
	 * @param string $site_item_id  WP-side id.
	 * @param string $old_value     Snapshot of the value before optimising (module-defined shape, usually JSON).
	 * @param string $new_value     Snapshot of the value after optimising.
	 * @param int    $score_before  Item score before.
	 * @param int    $score_after   Item score after.
	 * @param int    $credits_used  Credits spent on this optimisation (0 for free actions).
	 * @return int|false Inserted row id, or false if the table is missing.
	 */
	public function record( $site_item_id, $old_value, $new_value, $score_before, $score_after, $credits_used = 1 ) {
		global $wpdb;
		if ( ! Schema::items_table_exists() ) {
			return false;
		}
		$table = Schema::history_table();
		// phpcs:ignore WordPress.DB.DirectDatabaseQuery -- $wpdb->insert() escapes/prepares internally.
		$wpdb->insert( $table, array(
			'module'       => $this->module,
			'site_item_id' => (string) $site_item_id,
			'old_value'    => (string) $old_value,
			'new_value'    => (string) $new_value,
			'score_before' => null === $score_before ? null : (int) $score_before,
			'score_after'  => null === $score_after ? null : (int) $score_after,
			'credits_used' => max( 0, (int) $credits_used ),
			'created_at'   => current_time( 'mysql' ),
		) );
		return $wpdb->insert_id ?: false;
	}

	/**
	 * The most recent history row for one item — what "Undo" reverts to.
	 *
	 * @param string $site_item_id WP-side id.
	 * @return array<string,mixed>|null
	 */
	public function get_latest_for_item( $site_item_id ) {
		global $wpdb;
		$table = Schema::history_table();
		// phpcs:ignore WordPress.DB.DirectDatabaseQuery, WordPress.DB.PreparedSQL.NotPrepared -- values bound via prepare().
		$row = $wpdb->get_row( $wpdb->prepare(
			"SELECT * FROM {$table} WHERE module = %s AND site_item_id = %s ORDER BY created_at DESC, id DESC LIMIT 1",
			$this->module,
			(string) $site_item_id
		), ARRAY_A );
		return $row ?: null;
	}

	/**
	 * Recent history rows across every item, for a "Recent activity" feed.
	 *
	 * @param int $limit Max rows.
	 * @return array<int,array<string,mixed>>
	 */
	public function get_recent( $limit = 20 ) {
		global $wpdb;
		if ( ! Schema::items_table_exists() ) {
			return array();
		}
		$table = Schema::history_table();
		// phpcs:ignore WordPress.DB.DirectDatabaseQuery, WordPress.DB.PreparedSQL.NotPrepared -- values bound via prepare().
		$rows = $wpdb->get_results( $wpdb->prepare(
			"SELECT * FROM {$table} WHERE module = %s ORDER BY created_at DESC, id DESC LIMIT %d",
			$this->module,
			max( 1, (int) $limit )
		), ARRAY_A );
		return is_array( $rows ) ? $rows : array();
	}

	/**
	 * Total credits spent via optimisation for this module, this week — the
	 * "Credits used" figure on the Recent Progress card.
	 *
	 * @return int
	 */
	public function credits_used_this_week() {
		global $wpdb;
		if ( ! Schema::items_table_exists() ) {
			return 0;
		}
		$table = Schema::history_table();
		// phpcs:ignore WordPress.DB.DirectDatabaseQuery, WordPress.DB.PreparedSQL.NotPrepared -- values bound via prepare().
		return (int) $wpdb->get_var( $wpdb->prepare(
			"SELECT COALESCE(SUM(credits_used), 0) FROM {$table} WHERE module = %s AND created_at >= %s",
			$this->module,
			gmdate( 'Y-m-d H:i:s', strtotime( '-7 days' ) )
		) );
	}

	/**
	 * Every item this module has ever touched, mapped to its EARLIEST
	 * recorded old_value — i.e. the state the item was in before this
	 * module's very first optimisation. Powers a bulk "reset everything
	 * this plugin generated" action: reverting to the earliest snapshot
	 * (not the latest one, which undo() uses) restores an item to how it
	 * looked before OptiAI ever touched it, even if it's been optimised
	 * more than once since.
	 *
	 * @return array<string,string> site_item_id => old_value (module-defined shape, usually JSON)
	 */
	public function earliest_snapshots() {
		global $wpdb;
		if ( ! Schema::items_table_exists() ) {
			return array();
		}
		$table = Schema::history_table();
		// phpcs:ignore WordPress.DB.DirectDatabaseQuery, WordPress.DB.PreparedSQL.NotPrepared -- values bound via prepare().
		$rows = $wpdb->get_results( $wpdb->prepare(
			"SELECT h1.site_item_id, h1.old_value
			 FROM {$table} h1
			 WHERE h1.module = %s
			 AND h1.id = (
			     SELECT MIN(h2.id) FROM {$table} h2
			     WHERE h2.module = h1.module AND h2.site_item_id = h1.site_item_id
			 )",
			$this->module
		), ARRAY_A );

		$snapshots = array();
		foreach ( (array) $rows as $row ) {
			$snapshots[ (string) $row['site_item_id'] ] = (string) $row['old_value'];
		}
		return $snapshots;
	}
}
