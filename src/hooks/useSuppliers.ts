import { Supplier } from "@/components/features/suppliers/types";
import { SupplierSchema, supplierSchema } from "@/schemas/suppliers.schema";
import { getCurrentSession } from "@/services/auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { createSupplier, deleteSupplier, getSuppliersList, getSupplierById, updateSupplier } from "@/services/database";
import { PAGE_SIZE } from "@/config/constants";

export const useSuppliers = () => {
    const navigate = useNavigate(); 
    const [loading, setLoading] = useState(true);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);

    const [searchTerm, setSearchTerm] = useState("");

    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    // Pagination
    const [page, setPage] = useState(1);
    const [pageSize] = useState(PAGE_SIZE);

    const [totalCount, setTotalCount] = useState(0);

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
        const result = await getSuppliersList(searchTerm, page, pageSize);

        if (result.error) {
            toast.error("Erro ao carregar fornecedores");
        } else if (result.data) {
            setSuppliers(result.data as Supplier[]);
            setTotalCount(result.count || 0);
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
    }, [navigate, page, searchTerm]);

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

    const handleEditSafe = async (supplier: Supplier) => {
        const { data, error } = await getSupplierById(supplier.id);
        if (error || !data) {
            toast.error("Erro ao carregar detalhes do fornecedor.");
            return;
        }
        
        setEditingId(data.id);
        form.reset({
            name: data.name,
            cnpj: data.cnpj || "",
            email: data.email || "",
            phone: data.phone || "",
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

    return {
        loading,
        suppliers, // Server side filtered
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
        handleEdit: handleEditSafe,
        handleDeleteClick,
        handleDeleteConfirm,
        page,
        setPage,
        pageSize,
        totalCount
    };
};