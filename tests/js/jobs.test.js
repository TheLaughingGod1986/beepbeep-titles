/**
 * Unit tests for the bulk-job polling loop (src/jobs.js).
 *
 * pollJob is mocked; ApiError is the real class so `instanceof` checks in
 * jobs.js keep working. Fake timers + advanceTimersByTimeAsync drive the loop.
 */

jest.mock( '../../src/api', () => ( {
	...jest.requireActual( '../../src/api' ),
	pollJob: jest.fn(),
} ) );

const { pollJob, ApiError } = require( '../../src/api' );
const { pollUntilComplete } = require( '../../src/jobs' );

const running = ( items = [] ) => ( { status: 'running', items } );
const completed = ( items = [] ) => ( { status: 'completed', items } );

beforeEach( () => {
	jest.useFakeTimers();
	pollJob.mockReset();
} );

afterEach( () => {
	jest.useRealTimers();
} );

describe( 'pollUntilComplete', () => {
	test( 'resolves with the terminal envelope when the job completes', async () => {
		pollJob
			.mockResolvedValueOnce( running() )
			.mockResolvedValueOnce( completed( [ { id: 'a', status: 'completed' } ] ) );

		const promise = pollUntilComplete( 'job-1' );
		await jest.advanceTimersByTimeAsync( 2000 );

		await expect( promise ).resolves.toMatchObject( { status: 'completed' } );
		expect( pollJob ).toHaveBeenCalledTimes( 2 );
		expect( pollJob ).toHaveBeenCalledWith( 'job-1' );
	} );

	test( 'fires onItem once per item reaching a terminal state, no duplicates', async () => {
		// Item A completes on poll 1 and stays completed; item B completes on poll 3.
		pollJob
			.mockResolvedValueOnce( running( [
				{ wp_post_id: 1, status: 'completed' },
				{ wp_post_id: 2, status: 'pending' },
			] ) )
			.mockResolvedValueOnce( running( [
				{ wp_post_id: 1, status: 'completed' },
				{ wp_post_id: 2, status: 'pending' },
			] ) )
			.mockResolvedValueOnce( completed( [
				{ wp_post_id: 1, status: 'completed' },
				{ wp_post_id: 2, status: 'failed' },
			] ) );

		const onItem = jest.fn();
		const promise = pollUntilComplete( 'job-2', { onItem } );
		await jest.advanceTimersByTimeAsync( 4000 );
		await promise;

		expect( onItem ).toHaveBeenCalledTimes( 2 );
		expect( onItem.mock.calls[ 0 ][ 0 ] ).toMatchObject( { wp_post_id: 1, status: 'completed' } );
		expect( onItem.mock.calls[ 1 ][ 0 ] ).toMatchObject( { wp_post_id: 2, status: 'failed' } );
	} );

	test( 'backs off and keeps polling after a rate-limit error', async () => {
		pollJob
			.mockRejectedValueOnce( new ApiError( 'Slow down', { code: 'RATE_LIMIT_EXCEEDED', status: 429 } ) )
			.mockResolvedValueOnce( completed() );

		const promise = pollUntilComplete( 'job-3' );
		// Rate-limit backoff is 5s; advance past it.
		await jest.advanceTimersByTimeAsync( 6000 );

		await expect( promise ).resolves.toMatchObject( { status: 'completed' } );
		expect( pollJob ).toHaveBeenCalledTimes( 2 );
	} );

	test( 'rejects with AbortError when the signal is aborted mid-wait', async () => {
		pollJob.mockResolvedValue( running() );

		const controller = new AbortController();
		const promise = pollUntilComplete( 'job-4', { signal: controller.signal } );
		const expectation = expect( promise ).rejects.toMatchObject( { name: 'AbortError' } );

		// Let the first poll resolve and the loop enter its delay, then abort.
		await jest.advanceTimersByTimeAsync( 100 );
		controller.abort();

		await expectation;
	} );
} );
