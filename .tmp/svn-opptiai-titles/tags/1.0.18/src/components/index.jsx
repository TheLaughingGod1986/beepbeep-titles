/**
 * Back-compat shim. The primitive components now live in src/ui (the shared
 * design system); this re-exports them so existing `../components` imports keep
 * working. New code should import from '../ui'. App-specific components
 * (PageAvatar, SerpPreview) still live here.
 */
export { PageAvatar } from './PageAvatar';
export { SerpPreview } from './SerpPreview';

export {
    Icon,
    Card,
    Pill,
    Button,
    Progress,
    Ring,
    Divider,
    KBD,
    Tooltip,
    Toggle,
} from '../ui';
