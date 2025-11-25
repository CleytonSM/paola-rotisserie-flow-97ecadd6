import { LucideProps } from "lucide-react";

export const PixIcon = ({ className, ...props }: LucideProps) => (
    <img
        src="/pix.svg"
        alt="Pix"
        className={className}
        style={{ width: '1em', height: '1em' }} // Mimic icon sizing behavior
        {...props as any} // Cast to any to avoid prop type conflicts with img
    />
);
