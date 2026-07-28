<?php
/**
 * The same meta description reused across multiple scanned pages.
 *
 * @package BeepBeep_Titles
 */

namespace BeepBeep_Titles\Scoring\Rules;

use BeepBeep_Titles\Scoring\Metadata_Context;
use OptiAI\Core\Scoring\Issue;
use OptiAI\Core\Scoring\Rule_Interface;

defined( 'ABSPATH' ) || exit;

final class Duplicate_Description_Rule implements Rule_Interface {

    public function get_code(): string {
        return 'duplicate_description';
    }

    public function applies_to( $context ): bool {
        return $context instanceof Metadata_Context && trim( $context->meta_description ) !== '';
    }

    public function evaluate( $context ): ?Issue {
        /** @var Metadata_Context $context */
        if ( $context->description_duplicate_count < 1 ) {
            return null;
        }
        return new Issue(
            $this->get_code(),
            Issue::SEVERITY_WARNING,
            35,
            sprintf(
                /* translators: %d: number of other pages sharing this description. */
                _n(
                    'This meta description is also used on %d other page. A description unique to this page is more useful to searchers comparing results.',
                    'This meta description is also used on %d other pages. A description unique to this page is more useful to searchers comparing results.',
                    $context->description_duplicate_count,
                    'beepbeep-titles'
                ),
                $context->description_duplicate_count
            ),
            [ 'duplicate_count' => $context->description_duplicate_count ]
        );
    }
}
