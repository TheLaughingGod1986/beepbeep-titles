<?php
namespace BeepBeep_Titles;

class Generator {

    // ----------------------------------------------------------------
    // Public API
    // ----------------------------------------------------------------

    /**
     * Generate an SEO title and meta description for the given post.
     *
     * Returns [ 'title' => string, 'meta' => string ] on success,
     * or WP_Error on failure.  Falls back to a rule-based generator
     * when no API key is configured.
     */
    public function generate( \WP_Post $post, array $settings ): array|\WP_Error {
        $api_key = get_option( 'bbt_api_key', '' );

        if ( empty( $api_key ) ) {
            return $this->generate_fallback( $post, $settings );
        }

        return $this->generate_via_api( $post, $settings, (string) $api_key );
    }

    // ----------------------------------------------------------------
    // AI generation (Anthropic Claude)
    // ----------------------------------------------------------------

    private function generate_via_api( \WP_Post $post, array $settings, string $api_key ): array|\WP_Error {
        $prompt = $this->build_prompt( $post, $settings );

        $response = wp_remote_post( 'https://api.anthropic.com/v1/messages', [
            'timeout' => 30,
            'headers' => [
                'x-api-key'         => $api_key,
                'anthropic-version' => '2023-06-01',
                'content-type'      => 'application/json',
            ],
            'body' => wp_json_encode( [
                'model'      => 'claude-haiku-4-5-20251001',
                'max_tokens' => 300,
                'messages'   => [
                    [ 'role' => 'user', 'content' => $prompt ],
                ],
            ] ),
        ] );

        if ( is_wp_error( $response ) ) {
            return $response;
        }

        $status = wp_remote_retrieve_response_code( $response );
        if ( $status !== 200 ) {
            return new \WP_Error(
                'api_error',
                sprintf( __( 'BeepBeep AI API returned HTTP %d', 'beepbeep-titles' ), $status )
            );
        }

        $body = json_decode( wp_remote_retrieve_body( $response ), true );
        return $this->parse_api_response( $body );
    }

    private function build_prompt( \WP_Post $post, array $settings ): string {
        $tone         = $settings['tone']         ?? 'direct';
        $title_length = $settings['title_length'] ?? 'standard';
        $meta_length  = $settings['meta_length']  ?? 'standard';
        $custom       = trim( $settings['custom_instructions'] ?? '' );
        $site_name    = get_bloginfo( 'name' );
        $permalink    = get_permalink( $post->ID );

        $tone_map = [
            'direct'          => 'Direct and factual — plain, clear phrasing with no hype. Best for utility pages and docs.',
            'benefit'         => 'Benefit-led — open with the user outcome or gain. Higher click-through on commercial pages.',
            'authoritative'   => 'Authoritative — credibility signals, confident tone, suitable for long-form and cornerstone content.',
            'conversational'  => 'Conversational and human — warm, natural language that lowers click-friction on blog content.',
        ];

        $title_range = match ( $title_length ) {
            'compact'  => '40–50 characters',
            'rich'     => '60–65 characters',
            default    => '50–60 characters',
        };
        $meta_range = match ( $meta_length ) {
            'brief'    => '110–130 characters',
            'detailed' => '155–170 characters',
            default    => '135–155 characters',
        };

        // Limit content to ~1500 chars to avoid prompt bloat.
        $content = substr( wp_strip_all_tags( $post->post_content ), 0, 1500 );

        $prompt  = "Write an SEO title tag and meta description for the following WordPress page.\n\n";
        $prompt .= "Tone: {$tone_map[ $tone ] ?? $tone_map['direct']}\n";
        $prompt .= "Title length: {$title_range}\n";
        $prompt .= "Meta length: {$meta_range}\n";
        $prompt .= "Site name: {$site_name}\n";
        $prompt .= "Page title: {$post->post_title}\n";
        $prompt .= "URL: {$permalink}\n";
        $prompt .= "Content excerpt:\n{$content}\n";

        if ( $custom !== '' ) {
            $prompt .= "\nAdditional instructions: {$custom}\n";
        }

        $prompt .= "\nReturn ONLY a JSON object — no preamble, no markdown:\n";
        $prompt .= '{"title":"...","meta":"..."}';

        return $prompt;
    }

    private function parse_api_response( array $body ): array|\WP_Error {
        $text = $body['content'][0]['text'] ?? '';

        // Extract the JSON object from the response.
        preg_match( '/\{[^}]+\}/s', $text, $m );
        if ( empty( $m[0] ) ) {
            return new \WP_Error( 'parse_error', __( 'Could not parse AI response.', 'beepbeep-titles' ) );
        }

        $data = json_decode( $m[0], true );
        if ( ! isset( $data['title'], $data['meta'] ) ) {
            return new \WP_Error( 'parse_error', __( 'AI response missing title or meta fields.', 'beepbeep-titles' ) );
        }

        return [
            'title' => substr( sanitize_text_field( $data['title'] ), 0, 70 ),
            'meta'  => substr( sanitize_textarea_field( $data['meta'] ), 0, 170 ),
        ];
    }

    // ----------------------------------------------------------------
    // Rule-based fallback (no API key required)
    // ----------------------------------------------------------------

    private function generate_fallback( \WP_Post $post, array $settings ): array {
        $site_name = get_bloginfo( 'name' );
        $title     = "{$post->post_title} | {$site_name}";
        $excerpt   = $post->post_excerpt
            ?: wp_trim_words( wp_strip_all_tags( $post->post_content ), 28, '…' );

        return [
            'title' => substr( $title, 0, 60 ),
            'meta'  => substr( $excerpt, 0, 155 ),
        ];
    }
}
