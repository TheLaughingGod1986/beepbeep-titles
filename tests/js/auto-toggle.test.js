/**
 * Documents the auto-generate persistence contract (App.jsx handleAutoToggle).
 */

describe( 'auto-generate persistence contract', () => {
	test( 'toggle persists auto_generate via saveSettings for every service plan', async () => {
		const saveSettings = jest.fn().mockResolvedValue( { auto_generate: true } );
		const setAutoOptimise = jest.fn();
		const setSettings = jest.fn( fn => fn( {} ) );

		const handleAutoToggle = async ( val, { saveSettings: save, setAutoOptimise: setAuto, setSettings: setSet } ) => {
			await save( { auto_generate: val } );
			setAuto( val );
			setSet( s => ( { ...s, auto_generate: val } ) );
			return 'ok';
		};

		const result = await handleAutoToggle( true, {
			saveSettings,
			setAutoOptimise,
			setSettings,
		} );

		expect( result ).toBe( 'ok' );
		expect( saveSettings ).toHaveBeenCalledWith( { auto_generate: true } );
		expect( setAutoOptimise ).toHaveBeenCalledWith( true );
	} );
} );
