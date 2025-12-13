
interface ScaffoldingProps {
    children: React.ReactNode;
}


export const Scaffolding = ({ children }: ScaffoldingProps) => {
    return (
        <div className="flex min-h-screen flex-col">
            <main className="container flex-1 py-8 md:py-12">
                {children}
            </main>
        </div>
    )
}
