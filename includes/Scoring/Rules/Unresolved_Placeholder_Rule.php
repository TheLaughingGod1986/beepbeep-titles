<?php
/**
 * A meta description that still contains an unresolved shortcode, template
 * tag, or merge-field placeholder (e.g. a broken dynamic-tag integration).
 *
 * @package BeepBeep_Titles
 */

namespace BeepBeep_Titles\Scoring\Rules;

use BeepBeep_Titles\Scoring\Metadata_Context;
use BeepBeep_Titles\Scoring\Text_Utils;
use OptiAI\Core\Scoring\Issue;
use OptiAI\Core\Scoring\Rule_Interface;

defined( 'ABSPATH' ) || exit;

final class Unresolved_Placeholder_Rule implements Rule_Interface {

    public function get_code(): string {
        return 'unresolved_placeholder';
    }

    public function applies_to( $context ): bool {
        return $context instanceof Metadata_Context && trim( $context->meta_description ) !== '';
    }

    public function evaluate( $context ): ?Issue {
        /** @var Metadata_Context $context */
        if ( ! Text_Utils::has_unresolved_placeholder( $context->meta_description ) ) {
            return null;
        }
        return new Issue(
            $this->get_code(),
            Issue::SEVERITY_CRITICAL,
            30,
            __( 'This description appears to contain an unresolved shortcode or template tag that is being shown to visitors instead of real content.', 'beepbeep-titles' )
        );
    }
}
