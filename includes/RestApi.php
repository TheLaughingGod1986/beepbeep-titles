<?php
/**
 * WP REST proxy for OpptiAI Titles.
 *
 * Exposes /wp-json/beepbeep-titles/v1/* endpoints that forward to the
 * OpptiAI backend with the license + identity headers injected server-side,
 * and persist returned copy into the active SEO plugin. The license key never
 * reaches JS; the browser authenticates with the WP REST nonce.
 *
 * @package BeepBeep_Titles
 */

namespace BeepBeep_Titles;

use BeepBeep_Titles\Rest\Routes;

defined( 'ABSPATH' ) || exit;

class RestApi {

    public function __construct( private readonly Plugin $plugin ) {}

    public function init(): void {
        ( new Routes() )->register();
    }
}
