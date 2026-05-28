/**
 * BeepBeep Titles — WordPress admin React app entry point.
 *
 * Mounts <App /> into #bbt-root. The PHP Admin class renders that div
 * and localises initial state as window.bbtData before this script runs.
 */
import './index.css';
import { createRoot } from 'react-dom/client';
import App from './App';

const root = document.getElementById( 'bbt-root' );
if ( root ) {
    createRoot( root ).render( <App /> );
}
