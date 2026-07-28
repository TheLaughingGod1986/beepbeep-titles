<?php
/**
 * A page with no SEO title at all — the single worst finding for a title.
 *
 * @package BeepBeep_Titles
 */

namespace BeepBeep_Titles\Scoring\Rules;

use BeepBeep_Titles\Scoring\Metadata_Context;
use OptiAI\Core\Scoring\Issue;
use OptiAI\Core\Scoring\Rule_Interface;

defined( 'ABSPATH' ) || exit;

final class Missing_Title_Rule implements Rule_Interface {

    public function get_code(): string {
        return 'missing_title';
    }

    public function applies_to( $context ): bool {
        return $context instanceof Metadata_Context;
    }

    public function evaluate( $context ): ?Issue {
        /** @var Metadata_Context $context */
        if ( trim( $context->seo_title ) !== '' ) {
            return null;
        }
        return new Issue(
            $this->get_code(),
            Issue::SEVERITY_CRITICAL,
            100,
            __( 'This page does not currently have an SEO title. Search engines will fall back to the page name, which is rarely the best first impression in search results.', 'beepbeep-titles' )
        );
    }
}
