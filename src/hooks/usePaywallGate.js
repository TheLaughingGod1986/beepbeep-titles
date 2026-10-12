import { useMemo, useCallback } from 'react';
import {
    creditsPerPage,
    dailyRemainingForGate,
    heroGenerationCap,
    isBulkOverLimit,
    isDailyExhausted,
    canGenerateOne,
} from '../quota';

/** Centralises external-service credit checks used in App.jsx. */
export function usePaywallGate( quota ) {
    const dailyRemaining = useMemo( () => dailyRemainingForGate( quota ), [quota] );
    const costPerPage    = useMemo( () => creditsPerPage( quota ), [quota] );

    const checkDailyExhausted = useCallback( () => isDailyExhausted( dailyRemaining ), [dailyRemaining] );
    const checkCanGenerateOne = useCallback(
        () => canGenerateOne( dailyRemaining, costPerPage ),
        [dailyRemaining, costPerPage]
    );
    const checkBulkOverLimit  = useCallback(
        ( count ) => isBulkOverLimit( count, dailyRemaining, costPerPage ),
        [dailyRemaining, costPerPage]
    );
    const cap = useCallback(
        () => heroGenerationCap( dailyRemaining, costPerPage ),
        [dailyRemaining, costPerPage]
    );

    return {
        dailyRemaining,
        costPerPage,
        isDailyExhausted: checkDailyExhausted,
        canGenerateOne: checkCanGenerateOne,
        isBulkOverLimit: checkBulkOverLimit,
        heroCap: cap,
    };
}
