import { Supplier } from "@/components/ui/suppliers/types";
import { SupplierSchema, supplierSchema } from "@/schemas/suppliers.schema";
import { getCurrentSession } from "@/services/auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { createSupplier, deleteSupplier, getSuppliers, updateSupplier } from "@/services/database";
import { FormData } from "@/components/ui/suppliers/types";

export const useSuppliers = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);

    const [searchTerm, setSearchTerm] = useState("");

    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const form = useForm<SupplierSchema>({
        resolver: zodResolver(supplierSchema),
        defaultValues: {
            name: "",
            cnpj: "",
            email: "",
            phone: "",
        },
    });

    const loadData = async () => {
        setLoading(true);
        const result = await getSuppliers();

        if (result.error) {
            toast.error("Erro ao carregar fornecedores");
        } else if (result.data) {
            setSuppliers(result.data as Supplier[]);
        }

        setLoading(false);
    };

    useEffect(() => {
        const checkAuth = async () => {
            const { session } = await getCurrentSession();
            if (!session) {
                navigate("/auth");
                return;
            }
            loadData();
        };
        checkAuth();
    }, [navigate]);

    const onSubmit = async (data: SupplierSchema) => {
        try {
            // Clean CNPJ for API submission
            const apiData = {
                ...data,
                cnpj: data.cnpj ? data.cnpj.replace(/\D/g, "") : undefined,
            };

            const { error } = editingId
                ? await updateSupplier(editingId, apiData)
                : await createSupplier(apiData);

            if (error) {
                toast.error(editingId ? "Erro ao atualizar fornecedor" : "Erro ao criar fornecedor");
                return false;
            }

            toast.success(
                editingId ? "Fornecedor atualizado com sucesso!" : "Fornecedor criado com sucesso!"
            );
            setDialogOpen(false);
            setEditingId(null);
            form.reset();
            loadData();
            return true;
        } catch (err) {
            toast.error("Erro inesperado ao processar formulário");
            return false;
        }
    };

    const handleEdit = (supplier: Supplier) => {
        setEditingId(supplier.id);
        form.reset({
            name: supplier.name,
            cnpj: supplier.cnpj || "",
            email: supplier.email || "",
            phone: supplier.phone || "",
        });
        setDialogOpen(true);
    };

    const handleDeleteClick = (id: string) => {
        setDeletingId(id);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!deletingId) return;
        const { error } = await deleteSupplier(deletingId);
        if (error) {
            toast.error("Erro ao excluir fornecedor");
        } else {
            toast.success("Fornecedor excluído com sucesso!");
            loadData();
        }
        setDeleteDialogOpen(false);
        setDeletingId(null);
    };

    const handleDialogClose = (open: boolean) => {
        setDialogOpen(open);
        if (!open) {
            setEditingId(null);
            form.reset();
        }
    };

    const filteredSuppliers = useMemo(() => {
        return suppliers.filter((supplier) => {
            const searchLower = searchTerm.toLowerCase();

            return (
                supplier.name.toLowerCase().includes(searchLower) ||
                (supplier.cnpj && supplier.cnpj.includes(searchLower)) ||
                (supplier.email && supplier.email.toLowerCase().includes(searchLower)) ||
                (supplier.phone && supplier.phone.includes(searchLower))
            );
        });
    }, [suppliers, searchTerm]);

    return {
        loading,
        suppliers: filteredSuppliers,
        searchTerm,
        setSearchTerm,
        dialogOpen,
        setDialogOpen: handleDialogClose,
        editingId,
        deleteDialogOpen,
        setDeleteDialogOpen,
        deletingId,
        form,
        onSubmit: form.handleSubmit(onSubmit),
        handleEdit,
        handleDeleteClick,
        handleDeleteConfirm,
    };
};