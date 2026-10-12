import { __ } from '@wordpress/i18n';
import { Field, Input } from './ui';

/**
 * Optional "How did you find us?" answer on sign-up.
 * Values must match the backend (licenses.signup_source) and PostHog.
 */
export const SIGNUP_SOURCE_VALUES = [
    'wporg', 'search', 'x', 'facebook_group', 'friend', 'other',
];

export const signupSourceOptions = () => [
    [ 'wporg', __( 'WordPress.org', 'beepbeep-titles' ) ],
    [ 'search', __( 'Search engine', 'beepbeep-titles' ) ],
    [ 'x', __( 'X (Twitter)', 'beepbeep-titles' ) ],
    [ 'facebook_group', __( 'A Facebook group', 'beepbeep-titles' ) ],
    [ 'friend', __( 'A friend or colleague', 'beepbeep-titles' ) ],
    [ 'other', __( 'Other', 'beepbeep-titles' ) ],
];

/** Build the optional request fields. Blank / unknown = send nothing. */
export const signupSourcePayload = ( source, other ) => {
    if ( ! SIGNUP_SOURCE_VALUES.includes( source ) ) return {};
    const payload = { signup_source: source };
    if ( source === 'other' ) {
        const text = String( other || '' ).replace( /<[^>]*>/g, ' ' ).replace( /\s+/g, ' ' ).trim().slice( 0, 200 );
        if ( text ) payload.signup_source_other = text;
    }
    return payload;
};

export const SignupSourceField = ( { source, other, onSourceChange, onOtherChange, disabled } ) => (
    <>
        <Field label={ __( 'How did you find us? (optional)', 'beepbeep-titles' ) }>
            <select
                className="bbt-input"
                value={ source }
                disabled={ disabled }
                onChange={ e => {
                    onSourceChange( e.target.value );
                    if ( e.target.value !== 'other' ) onOtherChange( '' );
                } }
            >
                <option value="">{ __( 'Choose one (optional)', 'beepbeep-titles' ) }</option>
                { signupSourceOptions().map( ( [ value, label ] ) => (
                    <option key={ value } value={ value }>{ label }</option>
                ) ) }
            </select>
        </Field>
        { source === 'other' && (
            <Field label={ __( 'Tell us where (optional)', 'beepbeep-titles' ) }>
                <Input
                    value={ other }
                    maxLength={ 200 }
                    disabled={ disabled }
                    onChange={ e => onOtherChange( e.target.value ) }
                />
            </Field>
        ) }
    </>
);
