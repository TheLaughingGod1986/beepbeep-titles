export const TABS = [
    { id: 'dashboard',  label: 'Home' },
    { id: 'library',    label: 'Advanced Library' },
    { id: 'automation', label: 'Autopilot' },
    { id: 'settings',   label: 'Settings' },
    { id: 'billing',    label: 'Billing', adminOnly: true },
];

export function getVisibleTabs( _connected, { isAdmin = false } = {} ) {
    return TABS.filter( tab => ! tab.adminOnly || isAdmin );
}

export function resolveAllowedTab( tab, connected, { isAdmin = false } = {} ) {
    const allowed = getVisibleTabs( connected, { isAdmin } ).map( t => t.id );
    return allowed.includes( tab ) ? tab : 'dashboard';
}
