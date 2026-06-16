export const TABS = [
    { id: 'dashboard',  label: 'Home' },
    { id: 'library',    label: 'Library' },
    { id: 'automation', label: 'Autopilot' },
    { id: 'settings',   label: 'Settings' },
    { id: 'billing',    label: 'Billing', adminOnly: true },
];

export function getVisibleTabs( connected, { isAdmin = false } = {} ) {
    if ( ! connected ) {
        return TABS.filter( tab => tab.id === 'dashboard' );
    }
    return TABS.filter( tab => ! tab.adminOnly || isAdmin );
}

export function resolveAllowedTab( tab, connected, { isAdmin = false } = {} ) {
    const allowed = getVisibleTabs( connected, { isAdmin } ).map( t => t.id );
    return allowed.includes( tab ) ? tab : 'dashboard';
}
