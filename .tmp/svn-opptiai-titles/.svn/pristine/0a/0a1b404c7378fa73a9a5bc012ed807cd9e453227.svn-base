/**
 * Form primitives — shared input, textarea and labelled field.
 *
 * Styling lives in the `.bbt-input` / `.bbt-field__label` CSS classes
 * (index.css) so consumers don't repeat inline style objects or onFocus/onBlur
 * focus-ring handlers. Refs are forwarded so callers can focus/measure.
 */
import { forwardRef } from 'react';

const cx = ( ...parts ) => parts.filter( Boolean ).join( ' ' );

/** Text input. `size="sm"` for the denser settings forms. */
export const Input = forwardRef( ( { size, className = '', ...props }, ref ) => (
    <input
        ref={ref}
        className={cx( 'bbt-input', size === 'sm' && 'bbt-input--sm', className )}
        {...props}
    />
) );
Input.displayName = 'Input';

/** Multiline input. */
export const Textarea = forwardRef( ( { size, className = '', rows = 4, ...props }, ref ) => (
    <textarea
        ref={ref}
        rows={rows}
        className={cx( 'bbt-input', 'bbt-input--area', size === 'sm' && 'bbt-input--sm', className )}
        {...props}
    />
) );
Textarea.displayName = 'Textarea';

/**
 * Labelled field wrapper: an uppercase label with an optional right-aligned
 * slot (e.g. "Forgot password?"), then the control.
 */
export const Field = ( { label, right, children, style = {} } ) => (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 6, ...style }}>
        { ( label || right ) && (
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                { label && <span className="bbt-field__label">{label}</span> }
                {right}
            </span>
        ) }
        {children}
    </label>
);
