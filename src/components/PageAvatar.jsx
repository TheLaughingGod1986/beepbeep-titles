import { Icon } from './index';

export const PageAvatar = ({ section, hue = 220, size = 40, fontSize = 13, uppercase = false, failed = false, style = {} }) => {
    const letter = ( section || 'P' )[0];
    return (
        <div style={{
            width: size, height: size, borderRadius: 8,
            background: failed ? 'var(--danger-soft)' : `hsl(${hue}, 32%, 94%)`,
            color: failed ? 'var(--danger-ink)' : `hsl(${hue}, 38%, 32%)`,
            border: '1px solid var(--border)',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            fontSize, fontWeight: 700,
            ...style,
        }}>{failed ? <Icon name="alert" size={16}/> : ( uppercase ? letter.toUpperCase() : letter )}</div>
    );
};
