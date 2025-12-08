import { useEffect, useRef, useState } from 'react';

interface UseBarcodeScannerProps {
  onScan: (barcode: string) => void;
  minLength?: number;
  timeThreshold?: number; // Max time between keystrokes in ms
}

export function useBarcodeScanner({ 
  onScan, 
  minLength = 3, // EAN-13 is 13, but let's be flexible
  timeThreshold = 50 
}: UseBarcodeScannerProps) {
  const buffer = useRef<string>('');
  const lastKeyTime = useRef<number>(0);
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if focus is on an input or textarea, UNLESS it's the scanner input itself
      // Actually, scanners usually act like keyboards. If the user is focused on the search input,
      // we might just want to let the input handle it normally, OR we might want to intercept it
      // to do the "auto-select" magic. 
      // The user asked: "If it detects that sudden input fllowed but enter, then search in the product search"
      
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';
      
      const currentTime = Date.now();
      const timeDiff = currentTime - lastKeyTime.current;

      // If time diff is large, reset buffer (new sequence)
      if (timeDiff > timeThreshold) {
        buffer.current = '';
        setIsScanning(false);
      }

      if (e.key === 'Enter') {
        if (buffer.current.length >= minLength) {
            // It's likely a scan if the buffer is filled rapidly
            // However, if the user was just typing fast in an input, we might trigger this.
            // But scanners are SUPER fast, usually < 20-50ms per char.
            // Manual typing is rarely that consistent and fast.
            
            // If we are in an input, the input already has the value. 
            // We want to capture the "event" of a scan finishing.
            
            onScan(buffer.current);
            buffer.current = '';
            setIsScanning(false);
            
            // Prevent default form submission if needed, but handled by parent usually
        }
      } else if (e.key.length === 1) { // Printable characters
        buffer.current += e.key;
        lastKeyTime.current = currentTime;
        setIsScanning(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onScan, minLength, timeThreshold]);

  return { isScanning };
}
