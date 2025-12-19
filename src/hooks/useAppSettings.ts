import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAppSettings, saveAppSettings } from "@/services/database/settings";
import { AppSettings } from "@/types/entities";
import { toast } from "sonner";

export const useAppSettings = () => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["appSettings"],
    queryFn: async () => {
      const { data, error } = await getAppSettings();
      if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "no rows", which is fine initially
      return data;
    },
  });

  const mutation = useMutation({
    mutationFn: async (settings: Partial<AppSettings>) => {
      const { data, error } = await saveAppSettings(settings);
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appSettings"] });
      toast.success("Configurações salvas com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(`Erro ao salvar configurações: ${error.message}`);
    },
  });

  return {
    settings: query.data,
    isLoading: query.isLoading,
    saveSettings: mutation.mutateAsync,
    isSaving: mutation.isPending,
  };
};
