<?php
/**
 * The same SEO title reused across multiple scanned pages.
 *
 * @package BeepBeep_Titles
 */

namespace BeepBeep_Titles\Scoring\Rules;

use BeepBeep_Titles\Scoring\Metadata_Context;
use OptiAI\Core\Scoring\Issue;
use OptiAI\Core\Scoring\Rule_Interface;

defined( 'ABSPATH' ) || exit;

final class Duplicate_Title_Rule implements Rule_Interface {

    public function get_code(): string {
        return 'duplicate_title';
    }

    public function applies_to( $context ): bool {
        return $context instanceof Metadata_Context && trim( $context->seo_title ) !== '';
    }

    public function evaluate( $context ): ?Issue {
        /** @var Metadata_Context $context */
        if ( $context->title_duplicate_count < 1 ) {
            return null;
        }
        return new Issue(
            $this->get_code(),
            Issue::SEVERITY_WARNING,
            35,
            sprintf(
                /* translators: %d: number of other pages sharing this title. */
                _n(
                    'This SEO title is also used on %d other page. Unique titles help users and search engines tell your pages apart.',
                    'This SEO title is also used on %d other pages. Unique titles help users and search engines tell your pages apart.',
                    $context->title_duplicate_count,
                    'beepbeep-titles'
                ),
                $context->title_duplicate_count
            ),
            [ 'duplicate_count' => $context->title_duplicate_count ]
        );
    }
}
