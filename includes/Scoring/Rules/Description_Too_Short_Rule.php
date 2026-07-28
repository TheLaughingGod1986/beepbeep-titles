<?php
/**
 * A present but very short meta description.
 *
 * @package BeepBeep_Titles
 */

namespace BeepBeep_Titles\Scoring\Rules;

use BeepBeep_Titles\Scoring\Metadata_Context;
use OptiAI\Core\Scoring\Issue;
use OptiAI\Core\Scoring\Rule_Interface;

defined( 'ABSPATH' ) || exit;

final class Description_Too_Short_Rule implements Rule_Interface {

    private const MIN_CHARS = 70;

    public function get_code(): string {
        return 'description_too_short';
    }

    public function applies_to( $context ): bool {
        return $context instanceof Metadata_Context && trim( $context->meta_description ) !== '';
    }

    public function evaluate( $context ): ?Issue {
        /** @var Metadata_Context $context */
        $length = function_exists( 'mb_strlen' ) ? mb_strlen( $context->meta_description ) : strlen( $context->meta_description );
        if ( $length >= self::MIN_CHARS ) {
            return null;
        }
        return new Issue(
            $this->get_code(),
            Issue::SEVERITY_WARNING,
            25,
            __( 'This description is quite short and may not use the space search engines give it to explain what the page offers.', 'beepbeep-titles' )
        );
    }
}
