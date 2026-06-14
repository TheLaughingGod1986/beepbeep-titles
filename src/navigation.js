export const TABS = [
    { id: 'dashboard',  label: 'Home' },
    { id: 'library',    label: 'Library' },
    { id: 'automation', label: 'Autopilot' },
    { id: 'settings',   label: 'Settings' },
];

export function getVisibleTabs( connected ) {
    return connected ? TABS : TABS.filter( tab => tab.id === 'dashboard' );
}

export function resolveAllowedTab( tab, connected ) {
    return connected || tab === 'dashboard' ? tab : 'dashboard';
}
