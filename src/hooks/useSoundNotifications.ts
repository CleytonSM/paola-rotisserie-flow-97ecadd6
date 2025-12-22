import { useEffect, useCallback } from 'react';
import { SoundService } from '@/services/sound';
import { useAppSettings } from './useAppSettings';

/**
 * Hook for playing notification sounds in React components.
 * Automatically syncs with app settings and provides typed sound functions.
 */
export function useSoundNotifications() {
    const { settings } = useAppSettings();

    // Sync sound service enabled state with settings
    useEffect(() => {
        // Default to enabled if setting is not yet loaded
        const enabled = settings?.sound_enabled ?? true;
        SoundService.setEnabled(enabled);
    }, [settings?.sound_enabled]);

    // Initialize sound service on first use
    useEffect(() => {
        SoundService.init();
    }, []);

    const playOrderCreated = useCallback(() => {
        SoundService.playOrderCreated();
    }, []);

    const playStatusReady = useCallback(() => {
        SoundService.playStatusReady();
    }, []);

    const playStatusDelivered = useCallback(() => {
        SoundService.playStatusDelivered();
    }, []);

    const playScheduledAlert = useCallback(() => {
        SoundService.playScheduledAlert();
    }, []);

    return {
        playOrderCreated,
        playStatusReady,
        playStatusDelivered,
        playScheduledAlert,
        isEnabled: settings?.sound_enabled ?? true,
    };
}
