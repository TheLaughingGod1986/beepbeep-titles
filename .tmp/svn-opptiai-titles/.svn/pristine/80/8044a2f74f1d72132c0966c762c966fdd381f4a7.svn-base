<?php
/**
 * A page with no meta description at all.
 *
 * @package BeepBeep_Titles
 */

namespace BeepBeep_Titles\Scoring\Rules;

use BeepBeep_Titles\Scoring\Metadata_Context;
use OptiAI\Core\Scoring\Issue;
use OptiAI\Core\Scoring\Rule_Interface;

defined( 'ABSPATH' ) || exit;

final class Missing_Description_Rule implements Rule_Interface {

    public function get_code(): string {
        return 'missing_description';
    }

    public function applies_to( $context ): bool {
        return $context instanceof Metadata_Context;
    }

    public function evaluate( $context ): ?Issue {
        /** @var Metadata_Context $context */
        if ( trim( $context->meta_description ) !== '' ) {
            return null;
        }
        return new Issue(
            $this->get_code(),
            Issue::SEVERITY_CRITICAL,
            100,
            __( 'This page does not currently have a meta description. Search engines will pick their own snippet from the page content, which is often less compelling than a written one.', 'beepbeep-titles' )
        );
    }
}
