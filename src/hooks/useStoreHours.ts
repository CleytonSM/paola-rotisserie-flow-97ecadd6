import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getStoreHours, saveStoreHours } from "@/services/database/storeHours";
import { StoreHour } from "@/types/entities";
import { toast } from "sonner";

export const useStoreHours = () => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["storeHours"],
    queryFn: async () => {
      const { data, error } = await getStoreHours();
      if (error) throw error;
      return data;
    },
  });

  const mutation = useMutation({
    mutationFn: async (hours: Partial<StoreHour>[]) => {
      const { data, error } = await saveStoreHours(hours);
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["storeHours"] });
    },
    onError: (error: Error) => {
      toast.error(`Erro ao salvar horários: ${error.message}`);
    },
  });

  return {
    hours: query.data,
    isLoading: query.isLoading,
    saveHours: mutation.mutateAsync,
    isSaving: mutation.isPending,
  };
};
