/**
 * Done-screen Internal Linking card + dashboard banner targets, and the
 * review-prompt visibility rule.
 */
jest.mock( '@wordpress/i18n', () => ( { __: ( text ) => text } ), { virtual: true } );

import { internalLinkingNextAudit, internalLinkingBannerCompanion, INTERNAL_LINKING_WPORG_URL } from '../../src/quota';
import { shouldShowReviewPrompt } from '../../src/reviewPrompt';

describe( 'internalLinkingNextAudit', () => {
    it( 'points to the WordPress.org listing when Internal Linking is not active', () => {
        expect( INTERNAL_LINKING_WPORG_URL ).toBe( 'https://wordpress.org/plugins/opptiai-internal-linking/' );
        expect( internalLinkingNextAudit( { state: 'missing' } ) ).toEqual( { show: true, url: INTERNAL_LINKING_WPORG_URL } );
        expect( internalLinkingNextAudit( { state: 'installed' } ).show ).toBe( true );
        expect( internalLinkingNextAudit( undefined ).show ).toBe( true );
    } );

    it( 'is hidden once Internal Linking is active', () => {
        expect( internalLinkingNextAudit( { state: 'active', url: '/wp-admin/admin.php?page=oppti-internal-linking' } ).show ).toBe( false );
    } );
} );

describe( 'internalLinkingBannerCompanion', () => {
    it( 'sends missing installs to WordPress.org in a new tab', () => {
        const c = internalLinkingBannerCompanion( { state: 'missing', label: 'Install Internal Linking', url: '/wp-admin/plugin-install.php' } );
        expect( c.url ).toBe( INTERNAL_LINKING_WPORG_URL );
        expect( c.external ).toBe( true );
    } );

    it( 'keeps the in-admin link when installed or active', () => {
        expect( internalLinkingBannerCompanion( { state: 'active', url: '/a' } ) ).toEqual( { state: 'active', url: '/a' } );
        expect( internalLinkingBannerCompanion( { state: 'installed', url: '/p' } ).external ).toBeUndefined();
    } );
} );

describe( 'shouldShowReviewPrompt', () => {
    const url = 'https://wordpress.org/support/plugin/opptiai-titles/reviews/#new-post';
    it( 'shows after the first success until answered', () => {
        expect( shouldShowReviewPrompt( { eligible: true, done: false, url } ) ).toBe( true );
    } );
    it( 'never shows before a success or after an answer', () => {
        expect( shouldShowReviewPrompt( { eligible: false, done: false, url } ) ).toBe( false );
        expect( shouldShowReviewPrompt( { eligible: true, done: true, url } ) ).toBe( false );
        expect( shouldShowReviewPrompt( null ) ).toBe( false );
    } );
} );
