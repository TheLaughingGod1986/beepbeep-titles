<?php
/**
 * A title that carries no page-specific information (e.g. just "Home").
 *
 * @package BeepBeep_Titles
 */

namespace BeepBeep_Titles\Scoring\Rules;

use BeepBeep_Titles\Scoring\Metadata_Context;
use BeepBeep_Titles\Scoring\Text_Utils;
use OptiAI\Core\Scoring\Issue;
use OptiAI\Core\Scoring\Rule_Interface;

defined( 'ABSPATH' ) || exit;

final class Generic_Title_Rule implements Rule_Interface {

    public function get_code(): string {
        return 'generic_title';
    }

    public function applies_to( $context ): bool {
        return $context instanceof Metadata_Context && trim( $context->seo_title ) !== '';
    }

    public function evaluate( $context ): ?Issue {
        /** @var Metadata_Context $context */
        if ( ! Text_Utils::is_generic_title( $context->seo_title ) ) {
            return null;
        }
        return new Issue(
            $this->get_code(),
            Issue::SEVERITY_WARNING,
            20,
            __( 'This title is generic and could belong to almost any page. A more specific title helps both users and search engines understand what makes this page different.', 'beepbeep-titles' )
        );
    }
}
