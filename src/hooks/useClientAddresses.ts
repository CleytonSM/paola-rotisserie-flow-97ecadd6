import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getClientAddresses, createClientAddress, updateClientAddress, deleteClientAddress } from "@/services/database/addresses";
import { ClientAddress } from "@/types/entities";
import { toast } from "sonner";

export const useClientAddresses = (clientId?: string) => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["clientAddresses", clientId],
    queryFn: async () => {
      if (!clientId) return [];
      const { data, error } = await getClientAddresses(clientId);
      if (error) throw error;
      return data || [];
    },
    enabled: !!clientId,
  });

  const createMutation = useMutation({
    mutationFn: async (address: Omit<ClientAddress, 'id'>) => {
      const { data, error } = await createClientAddress(address);
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clientAddresses", clientId] });
      toast.success("Endereço adicionado com sucesso!");
    },
    onError: () => {
      toast.error("Erro ao adicionar endereço.");
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (addressId: string) => {
      const { data, error } = await deleteClientAddress(addressId);
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clientAddresses", clientId] });
      toast.success("Endereço removido com sucesso!");
    },
    onError: () => {
      toast.error("Erro ao remover endereço.");
    }
  });

  return {
    addresses: query.data || [],
    isLoading: query.isLoading,
    addAddress: createMutation.mutateAsync,
    isAdding: createMutation.isPending,
    deleteAddress: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
  };
};
