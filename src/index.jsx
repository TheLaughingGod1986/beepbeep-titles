/**
 * OpptiAI Titles — WordPress admin React app entry point.
 *
 * Mounts <App /> into #beepti-root. The PHP Admin class renders that div
 * and localises initial state as window.beeptiAdminData before this script runs.
 */
import './index.css';
import { createRoot } from 'react-dom/client';
import App from './App';

const root = document.getElementById( 'beepti-root' );
if ( root ) {
    createRoot( root ).render( <App /> );
}
