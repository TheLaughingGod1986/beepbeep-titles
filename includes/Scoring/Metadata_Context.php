<?php
/**
 * Everything a title/meta scoring rule needs to judge one page.
 *
 * @package BeepBeep_Titles
 */

namespace BeepBeep_Titles\Scoring;

defined( 'ABSPATH' ) || exit;

final class Metadata_Context {

    /** @var int */
    public $post_id;
    /** @var string */
    public $post_type;
    /** @var string */
    public $seo_title;
    /** @var string */
    public $meta_description;
    /** @var string */
    public $native_title;
    /** @var string */
    public $content_excerpt;
    /** @var int How many other scanned pages share this exact seo_title (0 = unique). */
    public $title_duplicate_count;
    /** @var int How many other scanned pages share this exact meta_description (0 = unique). */
    public $description_duplicate_count;

    public function __construct(
        int $post_id,
        string $post_type,
        string $seo_title,
        string $meta_description,
        string $native_title,
        string $content_excerpt,
        int $title_duplicate_count = 0,
        int $description_duplicate_count = 0
    ) {
        $this->post_id                     = $post_id;
        $this->post_type                   = $post_type;
        $this->seo_title                   = $seo_title;
        $this->meta_description            = $meta_description;
        $this->native_title                = $native_title;
        $this->content_excerpt             = $content_excerpt;
        $this->title_duplicate_count       = $title_duplicate_count;
        $this->description_duplicate_count = $description_duplicate_count;
    }
}
