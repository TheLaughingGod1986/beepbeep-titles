<?php
/**
 * A present but very short SEO title — usually not enough to describe the page.
 *
 * @package BeepBeep_Titles
 */

namespace BeepBeep_Titles\Scoring\Rules;

use BeepBeep_Titles\Scoring\Metadata_Context;
use OptiAI\Core\Scoring\Issue;
use OptiAI\Core\Scoring\Rule_Interface;

defined( 'ABSPATH' ) || exit;

final class Title_Too_Short_Rule implements Rule_Interface {

    private const MIN_CHARS = 20;

    public function get_code(): string {
        return 'title_too_short';
    }

    public function applies_to( $context ): bool {
        return $context instanceof Metadata_Context && trim( $context->seo_title ) !== '';
    }

    public function evaluate( $context ): ?Issue {
        /** @var Metadata_Context $context */
        $length = function_exists( 'mb_strlen' ) ? mb_strlen( $context->seo_title ) : strlen( $context->seo_title );
        if ( $length >= self::MIN_CHARS ) {
            return null;
        }
        return new Issue(
            $this->get_code(),
            Issue::SEVERITY_WARNING,
            25,
            __( 'This title is quite short and may not give search users enough context about the page before they click.', 'beepbeep-titles' )
        );
    }
}
