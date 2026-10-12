<?php
/**
 * A meta description long enough to be truncated in most search results.
 *
 * @package BeepBeep_Titles
 */

namespace BeepBeep_Titles\Scoring\Rules;

use BeepBeep_Titles\Scoring\Metadata_Context;
use OptiAI\Core\Scoring\Issue;
use OptiAI\Core\Scoring\Rule_Interface;

defined( 'ABSPATH' ) || exit;

final class Description_Too_Long_Rule implements Rule_Interface {

    private const MAX_CHARS = 165;

    public function get_code(): string {
        return 'description_too_long';
    }

    public function applies_to( $context ): bool {
        return $context instanceof Metadata_Context && trim( $context->meta_description ) !== '';
    }

    public function evaluate( $context ): ?Issue {
        /** @var Metadata_Context $context */
        $length = function_exists( 'mb_strlen' ) ? mb_strlen( $context->meta_description ) : strlen( $context->meta_description );
        if ( $length <= self::MAX_CHARS ) {
            return null;
        }
        return new Issue(
            $this->get_code(),
            Issue::SEVERITY_WARNING,
            20,
            __( 'This description may be truncated in some search results. Consider leading with the most important information.', 'beepbeep-titles' )
        );
    }
}
