/**
 * Sound Notification Service
 * 
 * Provides soft, warm audio notifications for the rotisserie system.
 * Uses HTML5 Audio API for simplicity and compatibility.
 */

export type SoundType = 'order-created' | 'status-ready' | 'status-delivered' | 'scheduled-alert';

const SOUND_PATHS: Record<SoundType, string> = {
    'order-created': '/sounds/order-chime.mp3',
    'status-ready': '/sounds/ready-bell.mp3',
    'status-delivered': '/sounds/complete-chime.mp3',
    'scheduled-alert': '/sounds/order-chime.mp3', // Reuse order chime for alerts
};

// Default volume (0.0 to 1.0) - medium level, not intrusive
const DEFAULT_VOLUME = 0.5;

class SoundServiceClass {
    private audioCache: Map<SoundType, HTMLAudioElement> = new Map();
    private enabled: boolean = true;

    /**
     * Initialize the service and preload audio files
     */
    init(): void {
        // Preload all sounds
        Object.entries(SOUND_PATHS).forEach(([type, path]) => {
            this.getOrCreateAudio(type as SoundType, path);
        });
    }

    /**
     * Set whether sounds are enabled
     */
    setEnabled(enabled: boolean): void {
        this.enabled = enabled;
    }

    /**
     * Check if sounds are currently enabled
     */
    isEnabled(): boolean {
        return this.enabled;
    }

    /**
     * Play sound when a new order is created (PDV success)
     */
    playOrderCreated(): void {
        this.play('order-created');
    }

    /**
     * Play sound when order status changes to "ready"
     */
    playStatusReady(): void {
        this.play('status-ready');
    }

    /**
     * Play sound when order status changes to "delivered"
     */
    playStatusDelivered(): void {
        this.play('status-delivered');
    }

    /**
     * Play sound for scheduled pickup alert
     */
    playScheduledAlert(): void {
        this.play('scheduled-alert');
    }

    /**
     * Core play method with visibility and enabled checks
     */
    private play(soundType: SoundType): void {
        // Don't play if disabled
        if (!this.enabled) return;

        // Don't play if tab is not visible (to avoid annoying background sounds)
        if (document.hidden) return;

        const path = SOUND_PATHS[soundType];
        const audio = this.getOrCreateAudio(soundType, path);

        // Reset to beginning if already playing
        audio.currentTime = 0;
        audio.volume = DEFAULT_VOLUME;

        // Play and catch any errors silently
        audio.play().catch(() => {
            // Silently fail - browser may block autoplay in some cases
            // This is fine since sounds are non-critical
        });
    }

    /**
     * Get cached audio element or create a new one
     */
    private getOrCreateAudio(soundType: SoundType, path: string): HTMLAudioElement {
        let audio = this.audioCache.get(soundType);
        
        if (!audio) {
            audio = new Audio(path);
            audio.preload = 'auto';
            this.audioCache.set(soundType, audio);
        }

        return audio;
    }
}

// Export singleton instance
export const SoundService = new SoundServiceClass();
