import { useMemo, useCallback } from 'react';
import {
    dailyRemainingForGate,
    heroGenerationCap,
    isBulkOverLimit,
    isDailyExhausted,
    isFreePlan,
} from '../quota';

/** Centralises free-plan generation gating used in App.jsx. */
export function usePaywallGate( plan, quota ) {
    const dailyRemaining = useMemo( () => dailyRemainingForGate( quota, plan ), [quota, plan] );
    const free           = isFreePlan( plan );

    const checkDailyExhausted = useCallback( () => isDailyExhausted( plan, dailyRemaining ), [plan, dailyRemaining] );
    const checkBulkOverLimit  = useCallback( ( count ) => isBulkOverLimit( plan, count, dailyRemaining ), [plan, dailyRemaining] );
    const cap                 = useCallback( () => heroGenerationCap( plan, dailyRemaining ), [plan, dailyRemaining] );

    return {
        dailyRemaining,
        isFree: free,
        isDailyExhausted: checkDailyExhausted,
        isBulkOverLimit: checkBulkOverLimit,
        heroCap: cap,
    };
}
