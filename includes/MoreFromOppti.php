<?php
/**
 * "More from Oppti" panel data for the admin app.
 *
 * The React app shows a small, dismissible panel on this plugin's own
 * Dashboard screen only, and only after the first applied title or meta
 * (the same site marker as the review prompt, or a success in this session).
 * It lists only OpptiAI plugins this site does not have (checked locally),
 * links to the in-dashboard installer search (WordPress.org when the user
 * cannot install plugins), and never installs anything.
 *
 * Dismissal is stored per user and never shown again. Optional events go
 * through the existing consented /telemetry bridge only.
 *
 * @package BeepBeep_Titles
 */

namespace BeepBeep_Titles;

defined( 'ABSPATH' ) || exit;

class MoreFromOppti {

    /** This plugin's catalog id (also used in events and utm_content). */
    public const FROM = 'titles';

    /** User meta: set once the user dismissed the panel. */
    public const DISMISS_META = 'beepti_more_from_oppti_dismissed';

    /** Site option: which OpptiAI plugins were installed at first activation (four booleans). */
    public const ACTIVATION_PLUGINS_OPTION = 'beepti_activation_oppti_plugins';

    /** Event property per plugin id for the installed flags. */
    public const FLAG_KEYS = [
        'alt'     => 'has_alt_text',
        'titles'  => 'has_titles',
        'linking' => 'has_il',
        'auditor' => 'has_auditor',
    ];

    /** UTM campaign for WordPress.org fallback links. */
    public const UTM_CAMPAIGN = 'push-nov26';

    /** Events the panel may send through the consented /telemetry bridge. */
    public const EVENTS = [ 'crosssell_clicked', 'crosssell_panel_shown', 'crosssell_panel_dismissed' ];

    /**
     * OpptiAI plugins. `kind` picks the row helper: credit ("Free to try."),
     * free ("A free plugin."), none (Internal Linking leads on the result only).
     * `login` marks the plugins the connected intro may name as using the
     * shared Oppti login (Alt Text and Titles only; never the Auditor).
     *
     * @return array<string,array{slug:string,name:string,kind:string,login:bool,text_domains:string[]}>
     */
    public static function catalog(): array {
        return [
            'alt'     => [
                'slug'         => 'beepbeep-ai-alt-text-generator',
                'name'         => 'OpptiAI Alt Text',
                'kind'         => 'credit',
                'login'        => true,
                'text_domains' => [ 'beepbeep-ai-alt-text-generator' ],
            ],
            'titles'  => [
                'slug'         => 'opptiai-titles',
                'name'         => 'OpptiAI Titles',
                'kind'         => 'credit',
                'login'        => true,
                'text_domains' => [ 'beepbeep-titles', 'opptiai-titles' ],
            ],
            'linking' => [
                'slug'         => 'opptiai-internal-linking',
                'name'         => 'OpptiAI Internal Linking',
                'kind'         => 'none',
                'login'        => false,
                'text_domains' => [ 'opptiai-internal-linking' ],
            ],
            'auditor' => [
                'slug'         => 'opptiai-website-auditor',
                'name'         => 'OpptiAI Website Auditor',
                'kind'         => 'free',
                'login'        => false,
                'text_domains' => [ 'opptiai-website-auditor' ],
            ],
        ];
    }

    /**
     * All panel copy in one place (Marketing's approved strings).
     *
     * @return array<string,string>
     */
    public static function copy(): array {
        return [
            'heading'       => __( 'More from Oppti', 'beepbeep-titles' ),
            /* translators: %s: plugin name(s), for example "Alt Text". */
            'login_line'    => __( 'Your same Oppti login also works with %s.', 'beepbeep-titles' ),
            'guest_line'    => __( 'More from OpptiAI, for the rest of the job.', 'beepbeep-titles' ),
            /* translators: 1: comma separated plugin names, 2: last plugin name. */
            'join_two'      => __( '%1$s and %2$s', 'beepbeep-titles' ),
            'short_alt'     => __( 'Alt Text', 'beepbeep-titles' ),
            'short_titles'  => __( 'Titles', 'beepbeep-titles' ),
            'short_auditor' => __( 'Website Auditor', 'beepbeep-titles' ),
            'short_linking' => __( 'Internal Linking', 'beepbeep-titles' ),
            'desc_alt'      => __( 'Write alt text for images that have none.', 'beepbeep-titles' ),
            'desc_titles'   => __( 'Find weak SEO titles and meta descriptions.', 'beepbeep-titles' ),
            'desc_auditor'  => __( 'See what to fix on your site first.', 'beepbeep-titles' ),
            'desc_linking'  => __( 'Find pages with no internal links.', 'beepbeep-titles' ),
            'cta_alt'       => __( 'Install Alt Text', 'beepbeep-titles' ),
            'cta_titles'    => __( 'Install Titles', 'beepbeep-titles' ),
            'cta_auditor'   => __( 'Install Website Auditor', 'beepbeep-titles' ),
            'cta_linking'   => __( 'Install Internal Linking', 'beepbeep-titles' ),
            'helper_credit' => __( 'Free to try.', 'beepbeep-titles' ),
            'helper_free'   => __( 'A free plugin. No account needed.', 'beepbeep-titles' ),
            'wporg_suffix'  => __( '(opens WordPress.org)', 'beepbeep-titles' ),
            'dismiss'       => __( 'Dismiss', 'beepbeep-titles' ),
            'dismiss_label' => __( 'Dismiss this More from Oppti panel', 'beepbeep-titles' ),
        ];
    }

    /**
     * Ids of OpptiAI plugins present in a get_plugins() style list.
     *
     * @param array<string,array<string,mixed>> $plugins Plugin file => header data.
     * @return string[]
     */
    public static function installed_ids( array $plugins ): array {
        $found = [];
        foreach ( self::catalog() as $id => $entry ) {
            foreach ( $plugins as $file => $data ) {
                $dir    = dirname( (string) $file );
                $domain = is_array( $data ) && isset( $data['TextDomain'] ) ? (string) $data['TextDomain'] : '';
                if ( $dir === $entry['slug'] || ( '' !== $domain && in_array( $domain, $entry['text_domains'], true ) ) ) {
                    $found[] = $id;
                    break;
                }
            }
        }
        return $found;
    }

    /**
     * Ids of OpptiAI plugins in a list of active plugin basenames.
     *
     * @param string[] $active_files Plugin basenames.
     * @return string[]
     */
    public static function active_ids( array $active_files ): array {
        $found = [];
        foreach ( self::catalog() as $id => $entry ) {
            foreach ( $active_files as $file ) {
                if ( dirname( (string) $file ) === $entry['slug'] ) {
                    $found[] = $id;
                    break;
                }
            }
        }
        return $found;
    }

    /**
     * Every OpptiAI plugin except this one and any already installed or active.
     *
     * @param string[] $installed_ids Installed ids.
     * @param string[] $active_ids    Active ids.
     * @return string[]
     */
    public static function candidate_ids( array $installed_ids, array $active_ids = [] ): array {
        $out = [];
        foreach ( array_keys( self::catalog() ) as $id ) {
            if ( self::FROM === $id || in_array( $id, $installed_ids, true ) || in_array( $id, $active_ids, true ) ) {
                continue;
            }
            $out[] = $id;
        }
        return $out;
    }

    /**
     * Install link: in-dashboard installer search, or tagged WordPress.org listing.
     *
     * @return array{url:string,target:string}
     */
    public static function link_for( string $id, bool $can_install ): array {
        $slug = self::catalog()[ $id ]['slug'] ?? '';
        if ( $can_install ) {
            return [
                'url'    => admin_url( 'plugin-install.php?s=' . rawurlencode( $slug ) . '&tab=search&type=term' ),
                'target' => 'installer',
            ];
        }
        $query = [
            'utm_source'   => 'plugin',
            'utm_medium'   => 'crosssell',
            'utm_campaign' => self::UTM_CAMPAIGN,
            'utm_content'  => 'xs-' . self::FROM . '-to-' . $id,
        ];
        return [
            'url'    => 'https://wordpress.org/plugins/' . $slug . '/?' . http_build_query( $query, '', '&' ),
            'target' => 'wporg',
        ];
    }

    /**
     * "A", "A and B" or "A, B and C".
     *
     * @param string[] $names Names.
     */
    public static function join_names( array $names ): string {
        $names = array_values( $names );
        $count = count( $names );
        if ( 0 === $count ) {
            return '';
        }
        if ( 1 === $count ) {
            return $names[0];
        }
        $last = array_pop( $names );
        return sprintf( self::copy()['join_two'], implode( ', ', $names ), $last );
    }

    /**
     * Intro line. Connected: names only the suggested plugins that use the
     * Oppti login (Alt Text, Titles); no intro when only Internal Linking
     * and/or the Auditor are left. Guests: plain intro, never the login line.
     *
     * @param string[] $candidate_ids Suggested ids.
     */
    public static function intro_line( bool $connected, array $candidate_ids ): string {
        $copy    = self::copy();
        $catalog = self::catalog();
        if ( $connected ) {
            $names = [];
            foreach ( $candidate_ids as $id ) {
                if ( ! empty( $catalog[ $id ]['login'] ) ) {
                    $names[] = $copy[ 'short_' . $id ] ?? $catalog[ $id ]['name'];
                }
            }
            return empty( $names ) ? '' : sprintf( $copy['login_line'], self::join_names( $names ) );
        }
        return $copy['guest_line'];
    }

    /**
     * Panel rows for the app.
     *
     * @param string[] $candidate_ids Suggested ids.
     * @return list<array<string,string>>
     */
    public static function items( array $candidate_ids, bool $can_install ): array {
        $catalog = self::catalog();
        $copy    = self::copy();
        $items   = [];
        foreach ( $candidate_ids as $id ) {
            if ( ! isset( $catalog[ $id ] ) ) {
                continue;
            }
            $link   = self::link_for( $id, $can_install );
            $kind   = $catalog[ $id ]['kind'];
            $helper = 'credit' === $kind ? $copy['helper_credit'] : ( 'free' === $kind ? $copy['helper_free'] : '' );
            $items[] = [
                'id'     => $id,
                'desc'   => $copy[ 'desc_' . $id ] ?? '',
                'helper' => $helper,
                'url'    => $link['url'],
                'target' => $link['target'],
                'cta'    => $copy[ 'cta_' . $id ] ?? '',
                'suffix' => 'wporg' === $link['target'] ? $copy['wporg_suffix'] : '',
            ];
        }
        return $items;
    }

    /**
     * Active plugin basenames, including network-active ones.
     *
     * @return string[]
     */
    public static function active_plugin_files(): array {
        $files = get_option( 'active_plugins', [] );
        $files = is_array( $files ) ? $files : [];
        if ( function_exists( 'is_multisite' ) && is_multisite() ) {
            $network = get_site_option( 'active_sitewide_plugins', [] );
            if ( is_array( $network ) ) {
                $files = array_merge( $files, array_keys( $network ) );
            }
        }
        return array_values( array_filter( array_map( 'strval', $files ) ) );
    }

    /**
     * Which OpptiAI plugins are installed on this site (for plugin_activated).
     * Four booleans, checked locally; this plugin always counts as installed.
     *
     * @return array{has_alt_text:bool,has_titles:bool,has_il:bool,has_auditor:bool}
     */
    public static function installed_flags(): array {
        if ( ! function_exists( 'get_plugins' ) && defined( 'ABSPATH' ) && is_readable( ABSPATH . 'wp-admin/includes/plugin.php' ) ) {
            require_once ABSPATH . 'wp-admin/includes/plugin.php';
        }
        $plugins = function_exists( 'get_plugins' ) ? get_plugins() : [];
        $ids     = array_merge(
            self::installed_ids( is_array( $plugins ) ? $plugins : [] ),
            self::active_ids( self::active_plugin_files() ),
            [ self::FROM ]
        );
        $flags = [];
        foreach ( self::FLAG_KEYS as $id => $key ) {
            $flags[ $key ] = in_array( $id, $ids, true );
        }
        return $flags;
    }

    /**
     * Whether the current user dismissed the panel.
     */
    public static function is_dismissed( int $user_id = 0 ): bool {
        $user_id = $user_id > 0 ? $user_id : get_current_user_id();
        return $user_id <= 0 || (bool) get_user_meta( $user_id, self::DISMISS_META, true );
    }

    /**
     * Seed for the admin app (window.beeptiAdminData.moreFromOppti).
     *
     * `eligible`: a title/meta has been applied on this site (the app also
     * flips it after a success in this session). `dismissed` hides it for good.
     * An empty `items` list means nothing to suggest (no panel).
     *
     * @return array<string,mixed>
     */
    public static function client_config( bool $connected ): array {
        $copy      = self::copy();
        $dismissed = self::is_dismissed();
        $items     = [];
        $intro     = '';
        if ( ! $dismissed ) {
            if ( ! function_exists( 'get_plugins' ) && defined( 'ABSPATH' ) && is_readable( ABSPATH . 'wp-admin/includes/plugin.php' ) ) {
                require_once ABSPATH . 'wp-admin/includes/plugin.php';
            }
            $plugins    = function_exists( 'get_plugins' ) ? get_plugins() : [];
            $candidates = self::candidate_ids(
                self::installed_ids( is_array( $plugins ) ? $plugins : [] ),
                self::active_ids( self::active_plugin_files() )
            );
            $items      = self::items( $candidates, current_user_can( 'install_plugins' ) );
            $intro      = self::intro_line( $connected, $candidates );
        }
        return [
            'eligible'     => (bool) get_option( ReviewPrompt::FIRST_SUCCESS_OPTION ),
            'dismissed'    => $dismissed,
            'from'         => self::FROM,
            'accountState' => $connected ? 'connected' : 'guest',
            'heading'      => $copy['heading'],
            'intro'        => $intro,
            'dismiss'      => $copy['dismiss'],
            'dismissLabel' => $copy['dismiss_label'],
            'items'        => $items,
        ];
    }

    /**
     * POST /more-from-oppti/dismiss: hidden for this user for good.
     */
    public static function rest_dismiss( \WP_REST_Request $req ): \WP_REST_Response {
        update_user_meta( get_current_user_id(), self::DISMISS_META, time() );
        return new \WP_REST_Response( [ 'dismissed' => true ] );
    }
}
