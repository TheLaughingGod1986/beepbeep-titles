<?php
/**
 * A description that reads like placeholder copy rather than a real summary.
 *
 * @package BeepBeep_Titles
 */

namespace BeepBeep_Titles\Scoring\Rules;

use BeepBeep_Titles\Scoring\Metadata_Context;
use BeepBeep_Titles\Scoring\Text_Utils;
use OptiAI\Core\Scoring\Issue;
use OptiAI\Core\Scoring\Rule_Interface;

defined( 'ABSPATH' ) || exit;

final class Generic_Description_Rule implements Rule_Interface {

    public function get_code(): string {
        return 'generic_description';
    }

    public function applies_to( $context ): bool {
        return $context instanceof Metadata_Context && trim( $context->meta_description ) !== '';
    }

    public function evaluate( $context ): ?Issue {
        /** @var Metadata_Context $context */
        if ( ! Text_Utils::is_generic_description( $context->meta_description ) ) {
            return null;
        }
        return new Issue(
            $this->get_code(),
            Issue::SEVERITY_WARNING,
            15,
            __( 'This description does not clearly explain what the page offers. A clearer description may improve relevance and click-through appeal.', 'beepbeep-titles' )
        );
    }
}
