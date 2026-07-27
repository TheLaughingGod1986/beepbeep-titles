<?php
/**
 * Assembles the title/description rule sets used by the scoring engine.
 *
 * Split into title-only and description-only groups because the Library
 * shows a separate Title score and Description score per page, alongside
 * the combined Overall score.
 *
 * @package BeepBeep_Titles
 */

namespace BeepBeep_Titles\Scoring;

use BeepBeep_Titles\Scoring\Rules\Description_Repetition_Rule;
use BeepBeep_Titles\Scoring\Rules\Description_Too_Long_Rule;
use BeepBeep_Titles\Scoring\Rules\Description_Too_Short_Rule;
use BeepBeep_Titles\Scoring\Rules\Duplicate_Description_Rule;
use BeepBeep_Titles\Scoring\Rules\Duplicate_Title_Rule;
use BeepBeep_Titles\Scoring\Rules\Excessive_Punctuation_Rule;
use BeepBeep_Titles\Scoring\Rules\Generic_Description_Rule;
use BeepBeep_Titles\Scoring\Rules\Generic_Title_Rule;
use BeepBeep_Titles\Scoring\Rules\Missing_Description_Rule;
use BeepBeep_Titles\Scoring\Rules\Missing_Title_Rule;
use BeepBeep_Titles\Scoring\Rules\Repeated_Words_Rule;
use BeepBeep_Titles\Scoring\Rules\Title_Too_Long_Rule;
use BeepBeep_Titles\Scoring\Rules\Title_Too_Short_Rule;
use BeepBeep_Titles\Scoring\Rules\Unresolved_Placeholder_Rule;
use OptiAI\Core\Scoring\Rule_Interface;

defined( 'ABSPATH' ) || exit;

final class Metadata_Rule_Registry {

    /** @return Rule_Interface[] */
    public static function title_rules(): array {
        /**
         * Filter the active title-scoring rules.
         *
         * @param Rule_Interface[] $rules Rule instances.
         */
        return apply_filters( 'beepti_title_scoring_rules', [
            new Missing_Title_Rule(),
            new Title_Too_Short_Rule(),
            new Title_Too_Long_Rule(),
            new Duplicate_Title_Rule(),
            new Generic_Title_Rule(),
            new Excessive_Punctuation_Rule(),
            new Repeated_Words_Rule(),
        ] );
    }

    /** @return Rule_Interface[] */
    public static function description_rules(): array {
        /**
         * Filter the active description-scoring rules.
         *
         * @param Rule_Interface[] $rules Rule instances.
         */
        return apply_filters( 'beepti_description_scoring_rules', [
            new Missing_Description_Rule(),
            new Description_Too_Short_Rule(),
            new Description_Too_Long_Rule(),
            new Duplicate_Description_Rule(),
            new Generic_Description_Rule(),
            new Description_Repetition_Rule(),
            new Unresolved_Placeholder_Rule(),
        ] );
    }
}
