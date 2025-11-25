import { SidebarHeader as SidebarHeaderUI, useSidebar } from "@/components/ui/sidebar";
import { AnimatePresence, motion } from "framer-motion";

interface SidebarHeaderProps {
    isExpanded: boolean;
}

export function SidebarHeader({ isExpanded }: SidebarHeaderProps) {
    const { isMobile } = useSidebar();

    return (
        <SidebarHeaderUI className="pt-4 pb-2 bg-background">
            <div className="flex w-full items-center justify-center overflow-hidden">
                <AnimatePresence mode="wait">
                    {(isExpanded || isMobile) ? (
                        <motion.div
                            key="expanded-logo"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="px-2 w-full flex items-center justify-center"
                        >
                            <img
                                src="/pg-rotisserie-banner.png"
                                alt="Paola Gonçalves"
                                className="max-w-full max-h-16 w-auto h-auto object-contain rounded-xl"
                            />
                        </motion.div>
                    ) : (
                        <motion.img
                            key="collapsed-logo"
                            src="/og-image.png"
                            alt="PG"
                            className="h-10 w-10 rounded-lg object-cover"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                        />
                    )}
                </AnimatePresence>
            </div>
        </SidebarHeaderUI>
    );
}