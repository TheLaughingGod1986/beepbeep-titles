<?php
/**
 * Titles that lean on repeated exclamation marks or ellipses instead of words.
 *
 * @package BeepBeep_Titles
 */

namespace BeepBeep_Titles\Scoring\Rules;

use BeepBeep_Titles\Scoring\Metadata_Context;
use BeepBeep_Titles\Scoring\Text_Utils;
use OptiAI\Core\Scoring\Issue;
use OptiAI\Core\Scoring\Rule_Interface;

defined( 'ABSPATH' ) || exit;

final class Excessive_Punctuation_Rule implements Rule_Interface {

    public function get_code(): string {
        return 'excessive_punctuation';
    }

    public function applies_to( $context ): bool {
        return $context instanceof Metadata_Context && trim( $context->seo_title ) !== '';
    }

    public function evaluate( $context ): ?Issue {
        /** @var Metadata_Context $context */
        if ( ! Text_Utils::has_excessive_punctuation( $context->seo_title ) ) {
            return null;
        }
        return new Issue(
            $this->get_code(),
            Issue::SEVERITY_REVIEW,
            10,
            __( 'This title has unusually heavy punctuation, which can look like clickbait in search results and get flagged by some search engines.', 'beepbeep-titles' )
        );
    }
}
