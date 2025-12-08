import { ProductSidebarRight } from "@/components/pdv/ProductSidebarRight";
import { usePDV } from "@/hooks/usePDV";
import { PDVHeader } from "@/components/pdv/PDVHeader";
import { PDVSearch } from "@/components/pdv/PDVSearch";
import { PDVCart } from "@/components/pdv/PDVCart";
import { PDVFooter } from "@/components/pdv/PDVFooter";
import { ScannerDialog } from "@/components/pdv/ScannerDialog";
import { ProductItemSelectionDialog } from "@/components/pdv/ProductItemSelectionDialog";

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
        performSearch,
        selectionOpen,
        setSelectionOpen,
        selectedProduct,
        handleInternalItemSelect,
        handleAddInternalItem,
        handleScannedProduct,
    } = usePDV();

    return (
        <div className="flex h-[calc(100vh-4rem)] md:h-screen bg-background overflow-hidden">
            <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
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
                    handleScannedProduct={handleScannedProduct}
                    handleInternalItemSelect={handleInternalItemSelect}
                />

                <PDVCart items={items} onAddInternalItem={handleAddInternalItem} />

                <PDVFooter total={total()} hasItems={items.length > 0} />
            </div>

            <ProductSidebarRight onProductSelect={handleProductSelect} />

            <ScannerDialog open={isScannerOpen} onOpenChange={setIsScannerOpen} />

            <ProductItemSelectionDialog
                open={selectionOpen}
                onOpenChange={setSelectionOpen}
                product={selectedProduct}
                onSelect={handleInternalItemSelect}
                excludedItemIds={
                    selectedProduct
                        ? items.find(i => i.id === selectedProduct.id)?.subItems?.map(s => s.id)
                        : []
                }
            />
        </div>
    );
}
