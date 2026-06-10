const VARIANTS = {
    compact: {
        padding: '12px 14px',
        faviconSize: 16,
        faviconFontSize: 9,
        rowMarginBottom: 3,
        titleStyle: { fontSize: 18, lineHeight: 1.3, color: '#1a0dab', fontFamily: 'arial, sans-serif', margin: '2px 0 3px' },
        metaStyle:  { fontSize: 13, lineHeight: 1.55, color: '#4d5156', fontFamily: 'arial, sans-serif' },
    },
    large: {
        padding: '16px 18px',
        faviconSize: 18,
        faviconFontSize: 10,
        rowMarginBottom: 4,
        titleStyle: { fontSize: 20, lineHeight: 1.3, color: '#1a0dab', fontWeight: 400, fontFamily: 'arial, sans-serif', margin: '4px 0' },
        metaStyle:  { fontSize: 14, lineHeight: 1.58, color: '#4d5156', fontFamily: 'arial, sans-serif' },
    },
};

export const SerpPreview = ({
    variant = 'compact',
    faviconLetter,
    url,
    siteName,
    displayUrl,
    title, titleFallback, titleKey,
    meta, metaFallback, metaKey, metaPrefix,
}) => {
    const v = VARIANTS[variant];
    return (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', padding: v.padding, fontFamily: 'arial, sans-serif' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: v.rowMarginBottom }}>
                <span style={{ width: v.faviconSize, height: v.faviconSize, borderRadius: 999, background: '#1a73e8', color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: v.faviconFontSize, fontWeight: 700 }}>{faviconLetter}</span>
                {variant === 'large' ? (
                    <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2, minWidth: 0 }}>
                        <span style={{ fontSize: 13, color: '#202124' }}>{siteName}</span>
                        <span style={{ fontSize: 12, color: '#5f6368' }}>{displayUrl}</span>
                    </div>
                ) : (
                    <span style={{ fontSize: 12, color: '#5f6368' }}>{url}</span>
                )}
            </div>
            <div key={titleKey} style={v.titleStyle}>
                {title || titleFallback}
            </div>
            <div key={metaKey} style={v.metaStyle}>
                {metaPrefix && <span style={{ color: '#70757a', marginRight: 4 }}>{metaPrefix}</span>}
                {meta || metaFallback}
            </div>
        </div>
    );
};
