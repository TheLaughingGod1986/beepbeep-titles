<?php
/**
 * An SEO title long enough to be truncated in most search result pages.
 *
 * @package BeepBeep_Titles
 */

namespace BeepBeep_Titles\Scoring\Rules;

use BeepBeep_Titles\Scoring\Metadata_Context;
use OptiAI\Core\Scoring\Issue;
use OptiAI\Core\Scoring\Rule_Interface;

defined( 'ABSPATH' ) || exit;

final class Title_Too_Long_Rule implements Rule_Interface {

    private const MAX_CHARS = 65;

    public function get_code(): string {
        return 'title_too_long';
    }

    public function applies_to( $context ): bool {
        return $context instanceof Metadata_Context && trim( $context->seo_title ) !== '';
    }

    public function evaluate( $context ): ?Issue {
        /** @var Metadata_Context $context */
        $length = function_exists( 'mb_strlen' ) ? mb_strlen( $context->seo_title ) : strlen( $context->seo_title );
        if ( $length <= self::MAX_CHARS ) {
            return null;
        }
        // Not a hard ranking rule — search engines set their own truncation
        // width per query, so this is framed as a possibility, not a fact.
        return new Issue(
            $this->get_code(),
            Issue::SEVERITY_WARNING,
            20,
            __( 'This title may be truncated in some search results. Consider tightening it so the most important words appear first.', 'beepbeep-titles' )
        );
    }
}
