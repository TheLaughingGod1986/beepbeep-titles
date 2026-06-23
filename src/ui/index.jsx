/**
 * `@beepbeep/ui` (in-tree) — the shared design-system surface.
 *
 * Single import point for the design tokens and primitive components that the
 * Titles and ALT Text plugins should both consume. Today it re-exports the
 * existing primitives in place; Phase 2 lifts this directory out into a
 * published package without changing the import path for consumers.
 *
 *   import { Button, Pill, FEATURE_COLORS } from '../ui';
 */

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
} from '../components';

export { COLOR, FEATURE_COLORS } from './tokens';
