<?php
/**
 * Everything a title/meta scoring rule needs to judge one page.
 *
 * @package BeepBeep_Titles
 */

namespace BeepBeep_Titles\Scoring;

defined( 'ABSPATH' ) || exit;

final class Metadata_Context {

    public function __construct(
        public readonly int $post_id,
        public readonly string $post_type,
        public readonly string $seo_title,
        public readonly string $meta_description,
        public readonly string $native_title,
        public readonly string $content_excerpt,
        /** How many other scanned pages share this exact seo_title (0 = unique). */
        public readonly int $title_duplicate_count = 0,
        /** How many other scanned pages share this exact meta_description (0 = unique). */
        public readonly int $description_duplicate_count = 0,
    ) {}
}
