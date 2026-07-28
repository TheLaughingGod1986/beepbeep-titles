<?php
/**
 * The same non-trivial word repeated three or more times in a title.
 *
 * @package BeepBeep_Titles
 */

namespace BeepBeep_Titles\Scoring\Rules;

use BeepBeep_Titles\Scoring\Metadata_Context;
use BeepBeep_Titles\Scoring\Text_Utils;
use OptiAI\Core\Scoring\Issue;
use OptiAI\Core\Scoring\Rule_Interface;

defined( 'ABSPATH' ) || exit;

final class Repeated_Words_Rule implements Rule_Interface {

    public function get_code(): string {
        return 'repeated_words';
    }

    public function applies_to( $context ): bool {
        return $context instanceof Metadata_Context && trim( $context->seo_title ) !== '';
    }

    public function evaluate( $context ): ?Issue {
        /** @var Metadata_Context $context */
        if ( ! Text_Utils::has_repeated_words( $context->seo_title ) ) {
            return null;
        }
        return new Issue(
            $this->get_code(),
            Issue::SEVERITY_REVIEW,
            15,
            __( 'A word in this title is repeated several times, which can read as keyword stuffing rather than a natural title.', 'beepbeep-titles' )
        );
    }
}
