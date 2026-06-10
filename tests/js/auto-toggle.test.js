/**
 * Documents the auto-generate persistence contract (App.jsx handleAutoToggle).
 */

describe( 'auto-generate persistence contract', () => {
	test( 'Pro toggle should persist auto_generate via saveSettings', async () => {
		const saveSettings = jest.fn().mockResolvedValue( { auto_generate: true } );
		const setAutoOptimise = jest.fn();
		const setSettings = jest.fn( fn => fn( {} ) );

		const handleAutoToggle = async ( val, { isFree, saveSettings: save, setAutoOptimise: setAuto, setSettings: setSet } ) => {
			if ( isFree ) return 'paywall';
			await save( { auto_generate: val } );
			setAuto( val );
			setSet( s => ( { ...s, auto_generate: val } ) );
			return 'ok';
		};

		const result = await handleAutoToggle( true, {
			isFree: false,
			saveSettings,
			setAutoOptimise,
			setSettings,
		} );

		expect( result ).toBe( 'ok' );
		expect( saveSettings ).toHaveBeenCalledWith( { auto_generate: true } );
		expect( setAutoOptimise ).toHaveBeenCalledWith( true );
	} );

	test( 'free plan should not call saveSettings', async () => {
		const saveSettings = jest.fn();
		const handleAutoToggle = async ( val, { isFree, saveSettings: save } ) => {
			if ( isFree ) return 'paywall';
			await save( { auto_generate: val } );
		};
		expect( await handleAutoToggle( true, { isFree: true, saveSettings } ) ).toBe( 'paywall' );
		expect( saveSettings ).not.toHaveBeenCalled();
	} );
} );
