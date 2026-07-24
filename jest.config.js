/**
 * Jest config for unit tests.
 *
 * Extends the @wordpress/scripts unit preset and ignores .claude/, which
 * holds local agent worktrees — full copies of this repo. Without this,
 * jest discovers each worktree's tests/ as well and runs every suite
 * three times over.
 */
const defaultConfig = require( '@wordpress/scripts/config/jest-unit.config' );

module.exports = {
	...defaultConfig,
	testPathIgnorePatterns: [
		'/node_modules/',
		'/.claude/',
	],
};
