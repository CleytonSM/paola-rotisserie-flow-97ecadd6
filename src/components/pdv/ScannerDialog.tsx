import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface ScannerDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function ScannerDialog({ open, onOpenChange }: ScannerDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md p-0 overflow-hidden bg-black border-0 text-white">
                <DialogHeader className="absolute top-0 left-0 right-0 z-10 p-4 bg-gradient-to-b from-black/80 to-transparent">
                    <DialogTitle className="text-center text-white font-medium">Escanear Código</DialogTitle>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-2 top-2 text-white hover:bg-white/20 rounded-full"
                        onClick={() => onOpenChange(false)}
                    >
                        <X className="h-5 w-5" />
                    </Button>
                </DialogHeader>
                <div className="relative w-full aspect-square bg-black">
                    <div id="reader" className="w-full h-full"></div>
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
                </div>
            </DialogContent>
        </Dialog>
    );
}
