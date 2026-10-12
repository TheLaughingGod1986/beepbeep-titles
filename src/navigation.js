export const TABS = [
    { id: 'dashboard',  label: 'Home' },
    { id: 'library',    label: 'Library' },
    { id: 'automation', label: 'Autopilot', requiresAuth: true },
    { id: 'settings',   label: 'Settings', requiresAuth: true },
    { id: 'billing',    label: 'Billing', adminOnly: true, requiresAuth: true },
];

export function getVisibleTabs( connected, { isAdmin = false } = {} ) {
    return TABS.filter( ( tab ) => {
        if ( tab.adminOnly && ! isAdmin ) return false;
        if ( tab.requiresAuth && ! connected ) return false;
        return true;
    } );
}

export function resolveAllowedTab( tab, connected, { isAdmin = false } = {} ) {
    const allowed = getVisibleTabs( connected, { isAdmin } ).map( t => t.id );
    return allowed.includes( tab ) ? tab : 'dashboard';
}
