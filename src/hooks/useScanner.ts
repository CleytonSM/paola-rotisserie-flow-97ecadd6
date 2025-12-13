import { useRef, useEffect, useCallback } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { toast } from "sonner";
import { getProductItemByBarcode } from "@/services/database/product-items";
import { searchProductCatalog, ProductCatalog } from "@/services/database/product-catalog";
import { ProductItem } from "@/services/database/product-items";

interface UseScannerProps {
    onInternalItemFound: (item: ProductItem) => void;
    onProductFound: (product: ProductCatalog) => void;
    onClose: () => void;
}

export function useScanner({ onInternalItemFound, onProductFound, onClose }: UseScannerProps) {
    const scannerRef = useRef<Html5Qrcode | null>(null);
    const lastScanTimeRef = useRef<number>(0);

    /**
     * Force-stops all camera tracks by querying the video element directly.
     * This is a fallback to ensure the camera light turns off.
     */
    const forceStopCameraTracks = useCallback(() => {
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
                // State 2 = SCANNING, State 3 = PAUSED
                if (state === 2 || state === 3) {
                    await scannerRef.current.stop();
                }
                scannerRef.current.clear();
            } catch (err) {
                console.warn("Scanner stop error:", err);
            } finally {
                // Always force-stop tracks as a safety net
                forceStopCameraTracks();
                scannerRef.current = null;
            }
        }
        onClose();
    }, [onClose, forceStopCameraTracks]);

    const initScanner = useCallback(async () => {
        if (!document.getElementById("reader")) {
            setTimeout(initScanner, 100);
            return;
        }

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

            try {
                const scannedBarcode = parseInt(decodedText, 10);
                if (!isNaN(scannedBarcode)) {
                    const { data: item } = await getProductItemByBarcode(scannedBarcode);
                    if (item) {
                        onInternalItemFound(item);
                        stopScanner();
                        return;
                    }
                }

                const { data } = await searchProductCatalog(decodedText);
                if (data && data.length > 0) {
                    onProductFound(data[0]);
                    stopScanner();
                } else {
                    toast.error("Produto não encontrado");
                }
            } catch (err) {
                console.error("Scan processing error:", err);
            }
        };

        const onScanError = (errorMessage: string) => {
            if (!errorMessage.includes("NotFoundException")) {
                console.warn("[Scanner] Scan error:", errorMessage);
            }
        };

        const startCamera = async () => {
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
                    return; // Success, exit loop
                } catch (err) {
                    if (constraints === undefined) {
                        handleCameraError(err);
                        onClose();
                    }
                }
            }
        };

        startCamera();
    }, [onInternalItemFound, onProductFound, onClose, stopScanner]);

    const handleCameraError = (err: any) => {
        const isLocalhost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
        const isHttps = window.location.protocol === "https:";

        if (!isHttps && !isLocalhost) {
            toast.error("Câmera requer HTTPS ou localhost.");
        } else if (err.name === "NotAllowedError") {
            toast.error("Permissão de câmera negada.");
        } else if (err.name === "NotReadableError") {
            toast.error("Câmera em uso por outro app.");
        } else {
            toast.error("Erro ao iniciar câmera.");
        }
    };

    useEffect(() => {
        initScanner();

        return () => {
            // On unmount, ensure everything is stopped
            stopScanner();
        };
    }, [initScanner, stopScanner]);

    return { stopScanner };
}
