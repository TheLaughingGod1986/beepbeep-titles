/**
 * Layout primitives — Row and Stack.
 *
 * Replace the most-repeated inline flex objects (`display:'flex',
 * alignItems:'center', gap:N` and the column variant) with named props so call
 * sites read as layout intent, not style soup. Extra styling still goes through
 * `style` for one-offs.
 *
 *   <Row gap={8} justify="between">…</Row>
 *   <Stack gap={12}>…</Stack>
 */

const JUSTIFY = {
    start: 'flex-start',
    center: 'center',
    end: 'flex-end',
    between: 'space-between',
    around: 'space-around',
};

// Matches the shared OpptiAI design system (and OpptiAI Alt Text): content
// column caps at 1180px so both products read identically on wide screens.
export const PAGE_MAX_WIDTH = 1180;

/** Shared page frame for admin screens. */
export const PageShell = ( { children, style = {}, ...rest } ) => (
    <div
        style={{
            width: '100%',
            maxWidth: PAGE_MAX_WIDTH,
            margin: '0 auto',
            padding: '28px 32px 64px',
            boxSizing: 'border-box',
            ...style,
        }}
        {...rest}
    >
        {children}
    </div>
);

/** Horizontal flex row. Defaults to vertically-centered with an 8px gap. */
export const Row = ( { gap = 8, align = 'center', justify, wrap = false, style = {}, children, ...rest } ) => (
    <div
        style={{
            display: 'flex',
            alignItems: align,
            gap,
            ...( justify ? { justifyContent: JUSTIFY[justify] || justify } : null ),
            ...( wrap ? { flexWrap: 'wrap' } : null ),
            ...style,
        }}
        {...rest}
    >
        {children}
    </div>
);

/** Vertical flex column. */
export const Stack = ( { gap = 8, align, justify, style = {}, children, ...rest } ) => (
    <div
        style={{
            display: 'flex',
            flexDirection: 'column',
            gap,
            ...( align ? { alignItems: align } : null ),
            ...( justify ? { justifyContent: JUSTIFY[justify] || justify } : null ),
            ...style,
        }}
        {...rest}
    >
        {children}
    </div>
);
