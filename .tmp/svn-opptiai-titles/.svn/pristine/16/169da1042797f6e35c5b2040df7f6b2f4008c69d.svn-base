<?php
/**
 * A description dominated by one word repeated unnaturally.
 *
 * @package BeepBeep_Titles
 */

namespace BeepBeep_Titles\Scoring\Rules;

use BeepBeep_Titles\Scoring\Metadata_Context;
use BeepBeep_Titles\Scoring\Text_Utils;
use OptiAI\Core\Scoring\Issue;
use OptiAI\Core\Scoring\Rule_Interface;

defined( 'ABSPATH' ) || exit;

final class Description_Repetition_Rule implements Rule_Interface {

    public function get_code(): string {
        return 'description_repetition';
    }

    public function applies_to( $context ): bool {
        return $context instanceof Metadata_Context && trim( $context->meta_description ) !== '';
    }

    public function evaluate( $context ): ?Issue {
        /** @var Metadata_Context $context */
        if ( ! Text_Utils::has_excessive_repetition( $context->meta_description ) ) {
            return null;
        }
        return new Issue(
            $this->get_code(),
            Issue::SEVERITY_REVIEW,
            15,
            __( 'A word in this description repeats several times, which reads as keyword stuffing rather than a natural summary.', 'beepbeep-titles' )
        );
    }
}
