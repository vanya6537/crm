import { useCallback, useState } from 'react';

export const OTP_MAX_LENGTH = 6;

interface TwoFactorSetupData {
    qrCodeSvg?: string;
    manualSetupKey?: string;
}

interface TwoFactorRecoveryCodes {
    codes: string[];
}

export function useTwoFactorAuth() {
    const [qrCodeSvg, setQrCodeSvg] = useState<string | null>(null);
    const [manualSetupKey, setManualSetupKey] = useState<string | null>(null);
    const [recoveryCodesList, setRecoveryCodesList] = useState<string[]>([]);
    const [errors, setErrors] = useState<Record<string, string[]>>({});
    const [isLoading, setIsLoading] = useState(false);

    const hasSetupData = !!(qrCodeSvg || manualSetupKey);

    const clearSetupData = useCallback(() => {
        setQrCodeSvg(null);
        setManualSetupKey(null);
        setErrors({});
    }, []);

    const fetchSetupData = useCallback(async () => {
        setIsLoading(true);
        setErrors({});
        try {
            const response = await fetch('/two-factor/setup', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });

            if (!response.ok) {
                throw new Error('Failed to fetch setup data');
            }

            const data: TwoFactorSetupData = await response.json();
            setQrCodeSvg(data.qrCodeSvg || null);
            setManualSetupKey(data.manualSetupKey || null);
        } catch (err) {
            const error =
                err instanceof Error ? err.message : 'Failed to fetch setup data';
            setErrors({ setup: [error] });
        } finally {
            setIsLoading(false);
        }
    }, []);

    const fetchRecoveryCodes = useCallback(async () => {
        setIsLoading(true);
        setErrors({});
        try {
            const response = await fetch('/two-factor/recovery-codes', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });

            if (!response.ok) {
                throw new Error('Failed to fetch recovery codes');
            }

            const data: TwoFactorRecoveryCodes = await response.json();
            setRecoveryCodesList(data.codes || []);
        } catch (err) {
            const error =
                err instanceof Error
                    ? err.message
                    : 'Failed to fetch recovery codes';
            setErrors({ recovery: [error] });
        } finally {
            setIsLoading(false);
        }
    }, []);

    return {
        qrCodeSvg,
        hasSetupData,
        manualSetupKey,
        clearSetupData,
        fetchSetupData,
        recoveryCodesList,
        fetchRecoveryCodes,
        errors,
        isLoading,
    };
}
