import { useMemo, useCallback } from 'react';
import {
    dailyRemainingForGate,
    heroGenerationCap,
    isBulkOverLimit,
    isDailyExhausted,
} from '../quota';

/** Centralises external-service credit checks used in App.jsx. */
export function usePaywallGate( quota ) {
    const dailyRemaining = useMemo( () => dailyRemainingForGate( quota ), [quota] );

    const checkDailyExhausted = useCallback( () => isDailyExhausted( dailyRemaining ), [dailyRemaining] );
    const checkBulkOverLimit  = useCallback( ( count ) => isBulkOverLimit( count, dailyRemaining ), [dailyRemaining] );
    const cap                 = useCallback( () => heroGenerationCap( dailyRemaining ), [dailyRemaining] );

    return {
        dailyRemaining,
        isDailyExhausted: checkDailyExhausted,
        isBulkOverLimit: checkBulkOverLimit,
        heroCap: cap,
    };
}
