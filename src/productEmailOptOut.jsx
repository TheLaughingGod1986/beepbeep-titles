import { __ } from '@wordpress/i18n';

/**
 * Optional "Don't send me product tips and plan emails" checkbox on sign-up.
 * Unticked by default. Stored on the account as product_emails_opt_out.
 */
export const productEmailOptOutPayload = ( optOut ) => ( {
    product_emails_opt_out: optOut === true,
} );

export const ProductEmailOptOutField = ( { checked, onChange, disabled } ) => (
    <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, cursor: disabled ? 'default' : 'pointer' }}>
        <input
            type="checkbox"
            name="product_emails_opt_out"
            checked={ checked === true }
            disabled={ disabled }
            onChange={ e => onChange( e.target.checked ) }
            style={{ width: 16, height: 16, marginTop: 1, flexShrink: 0 }}
        />
        <span style={{ fontSize: 12.5, color: 'var(--text-2)', lineHeight: 1.4 }}>
            { __( "Don't send me product tips and plan emails", 'beepbeep-titles' ) }
        </span>
    </label>
);
