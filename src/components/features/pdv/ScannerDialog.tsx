import { useRef, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Html5Qrcode } from "html5-qrcode";
import { toast } from "sonner";
import { getProductItemByBarcode, ProductItem } from "@/services/database/product-items";
import { searchProductCatalog, ProductCatalog } from "@/services/database/product-catalog";

interface ScannerDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onProductFound: (product: ProductCatalog) => void;
    onInternalItemFound: (item: ProductItem) => void;
    onScan?: (barcode: string) => void;
}

export function ScannerDialog({ open, onOpenChange, onProductFound, onInternalItemFound, onScan }: ScannerDialogProps) {
    const scannerRef = useRef<Html5Qrcode | null>(null);
    const lastScanTimeRef = useRef<number>(0);

    const forceStopAllTracks = useCallback(() => {
        // Force stop any video tracks in the reader element
        const videoElement = document.querySelector("#reader video") as HTMLVideoElement | null;
        if (videoElement?.srcObject) {
            const stream = videoElement.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
            videoElement.srcObject = null;
        }
    }, []);

    const stopScanner = useCallback(async () => {
        if (scannerRef.current) {
            try {
                const state = scannerRef.current.getState();
                if (state === 2 || state === 3) { // SCANNING or PAUSED
                    await scannerRef.current.stop();
                }
                scannerRef.current.clear();
            } catch (err) {
                console.warn("Scanner stop error:", err);
            } finally {
                scannerRef.current = null;
            }
        }
        forceStopAllTracks();
    }, [forceStopAllTracks]);

    const initScanner = useCallback(async () => {
        // Wait for the reader element to exist
        const readerEl = document.getElementById("reader");
        if (!readerEl) {
            setTimeout(initScanner, 100);
            return;
        }

        // Don't initialize if already running
        if (scannerRef.current) return;

        const html5QrCode = new Html5Qrcode("reader");
        scannerRef.current = html5QrCode;

        const config = {
            fps: 15,
            qrbox: { width: 280, height: 280 },
            aspectRatio: 1.0,
            disableFlip: false,
        };

        const onScanSuccess = async (decodedText: string) => {
            const now = Date.now();
            if (now - lastScanTimeRef.current < 2000) return;
            lastScanTimeRef.current = now;

            // Optional raw scan override
            if (onScan) {
                onScan(decodedText);
                return;
            }

            try {
                const scannedBarcode = parseInt(decodedText, 10);
                if (!isNaN(scannedBarcode)) {
                    const { data: item } = await getProductItemByBarcode(scannedBarcode);
                    if (item) {
                        onInternalItemFound(item);
                        onOpenChange(false); // Close dialog, cleanup will happen via effect
                        return;
                    }
                }

                const { data } = await searchProductCatalog(decodedText);
                if (data && data.length > 0) {
                    onProductFound(data[0]);
                    onOpenChange(false); // Close dialog
                } else {
                    toast.error("Produto não encontrado");
                    // Don't close on not found - let user try again or close manually
                }
            } catch (err) {
                // Silently handle scan processing errors
            }
        };

        const onScanError = () => {
            // Silently ignore scan errors (e.g., NotFoundException)
        };

        const strategies = [
            { facingMode: "environment" },
            { facingMode: "user" },
            undefined
        ];

        for (const constraints of strategies) {
            try {
                await html5QrCode.start(
                    constraints || { facingMode: "environment" },
                    config,
                    onScanSuccess,
                    onScanError
                );
                return;
            } catch (err) {
                if (constraints === undefined) {
                    toast.error("Não foi possível iniciar a câmera.");
                    onOpenChange(false);
                }
            }
        }
    }, [onInternalItemFound, onProductFound, onOpenChange]);

    // Main effect: start scanner when open, stop when closed
    useEffect(() => {
        if (open) {
            initScanner();
        } else {
            // Dialog is closing - ALWAYS stop the scanner
            stopScanner();
        }

        // Cleanup on unmount
        return () => {
            stopScanner();
        };
    }, [open, initScanner, stopScanner]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md p-0 overflow-hidden bg-black border-0 text-white">
                <DialogHeader className="p-4 bg-gradient-to-b from-black/80 to-transparent">
                    <DialogTitle className="text-center text-white font-medium">Escanear Código</DialogTitle>
                </DialogHeader>
                <div className="relative w-full aspect-square bg-black">
                    {/* Reader element is always present when dialog is open */}
                    {open && <div id="reader" className="w-full h-full"></div>}
                    <div className="absolute inset-0 border-[30px] border-black/50 pointer-events-none z-0"></div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 border-2 border-white/50 rounded-lg pointer-events-none z-10">
                        <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-primary -mt-0.5 -ml-0.5"></div>
                        <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-primary -mt-0.5 -mr-0.5"></div>
                        <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-primary -mb-0.5 -ml-0.5"></div>
                        <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-primary -mb-0.5 -mr-0.5"></div>
                    </div>
                </div>
                <div className="p-4 bg-black text-center">
                    <p className="text-sm text-gray-400">Aponte a câmera para o código de barras</p>
                    <p className="text-xs text-gray-500 mt-2">EAN-13, UPC, QR Code e outros formatos</p>
                </div>
            </DialogContent>
        </Dialog>
    );
}
