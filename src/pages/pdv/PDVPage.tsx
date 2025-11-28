import { ProductSidebarRight } from "@/components/pdv/ProductSidebarRight";
import { usePDV } from "@/hooks/usePDV";
import { PDVHeader } from "@/components/pdv/PDVHeader";
import { PDVSearch } from "@/components/pdv/PDVSearch";
import { PDVCart } from "@/components/pdv/PDVCart";
import { PDVFooter } from "@/components/pdv/PDVFooter";
import { ScannerDialog } from "@/components/pdv/ScannerDialog";

export default function PDVPage() {
    const {
        items,
        total,
        itemCount,
        searchQuery,
        setSearchQuery,
        searchResults,
        isScannerOpen,
        setIsScannerOpen,
        showPreview,
        setShowPreview,
        searchContainerRef,
        handleProductSelect,
        handleButtonClick,
        isMobile,
        performSearch
    } = usePDV();

    return (
        <div className="flex h-full bg-background overflow-hidden">
            <div className="flex-1 flex flex-col min-w-0">
                <PDVHeader itemCount={itemCount()} />

                <PDVSearch
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    searchResults={searchResults}
                    showPreview={showPreview}
                    setShowPreview={setShowPreview}
                    handleProductSelect={handleProductSelect}
                    handleButtonClick={handleButtonClick}
                    isMobile={isMobile}
                    searchContainerRef={searchContainerRef}
                    performSearch={performSearch}
                />

                <PDVCart items={items} />

                <PDVFooter total={total()} hasItems={items.length > 0} />
            </div>

            <ProductSidebarRight />

            <ScannerDialog open={isScannerOpen} onOpenChange={setIsScannerOpen} />
        </div>
    );
}
