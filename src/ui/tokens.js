/**
 * Design tokens — the JS side of the OpptiAI design system.
 *
 * The CSS custom properties in `index.css` (`:root`) are the source of truth
 * for anything styled in CSS. This module mirrors the subset that JavaScript
 * needs as literal values — places that build inline styles or pass colours
 * into components (charts, the shared credit-usage card, avatars). Keep the two
 * in sync; when this moves into the shared `@beepbeep/ui` package both plugins
 * import from here instead of re-hardcoding hex.
 */

/** Core semantic colours (mirror of the CSS `--*` tokens). */
export const COLOR = {
    primary:     '#2563eb',
    primaryInk:  '#1d4ed8',
    ok:          '#10b981',
    okInk:       '#047857',
    warn:        '#d97706',
    warnInk:     '#b45309',
    danger:      '#ef4444',
    dangerInk:   '#b91c1c',
    text:        '#0f172a',
    text2:       '#475569',
    text3:       '#64748b',
    border:      '#e2e8f0',
    surface:     '#ffffff',
    surfaceSunken: '#f8fafc',
};

/**
 * Per-plugin feature palette for the shared "Credit usage" card — one entry per
 * OpptiAI plugin that draws on the shared wallet. Single source of truth so
 * Titles, ALT Text, and future plugins render identical colours for the same
 * feature (Titles = blue, ALT Text = green, Schema = amber).
 */
export const FEATURE_COLORS = {
    title_meta: { color: '#2563eb', soft: '#eff6ff', border: '#bfdbfe' },
    alt_text:   { color: '#059669', soft: '#ecfdf5', border: '#a7f3d0' },
    schema:     { color: '#d97706', soft: '#fffbeb', border: '#fde68a' },
    other:      { color: '#64748b', soft: '#f8fafc', border: '#e2e8f0' },
};
