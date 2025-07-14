import { useState } from "react";
import * as React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Trip } from "@shared/schema";
import { MapPin, Calendar, DollarSign, Heart, Save, X } from "lucide-react";
import { format } from "date-fns";

const editTripSchema = z.object({
  name: z.string().min(1, "Nome da viagem é obrigatório"),
  destination: z.string().min(1, "Destino é obrigatório"),
  startDate: z.string().min(1, "Data de início é obrigatória"),
  endDate: z.string().min(1, "Data de fim é obrigatória"),
  budget: z.string().min(1, "Orçamento é obrigatório"),
  preferences: z.string().optional(),
});

type EditTripForm = z.infer<typeof editTripSchema>;

interface EditTripModalProps {
  trip: Trip | null;
  open: boolean;
  onClose: () => void;
  onTripUpdated: (trip: Trip) => void;
}

export function EditTripModal({ trip, open, onClose, onTripUpdated }: EditTripModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<EditTripForm>({
    resolver: zodResolver(editTripSchema),
    defaultValues: {
      name: trip?.name || "",
      destination: trip?.destination || "",
      startDate: trip?.startDate || "",
      endDate: trip?.endDate || "",
      budget: trip?.budget || "",
      preferences: trip?.preferences || "",
    },
  });

  // Reset form when trip changes
  React.useEffect(() => {
    if (trip) {
      form.reset({
        name: trip.name,
        destination: trip.destination,
        startDate: trip.startDate,
        endDate: trip.endDate,
        budget: trip.budget,
        preferences: trip.preferences || "",
      });
    }
  }, [trip, form]);

  const updateTripMutation = useMutation({
    mutationFn: async (data: EditTripForm) => {
      if (!trip) throw new Error("No trip selected");
      
      const response = await apiRequest(`/api/trips/${trip.id}`, {
        method: "PUT",
        body: {
          name: data.name,
          destination: data.destination,
          startDate: data.startDate,
          endDate: data.endDate,
          budget: data.budget,
          preferences: data.preferences,
        },
      });
      
      return response;
    },
    onSuccess: (updatedTrip) => {
      queryClient.invalidateQueries({ queryKey: ["/api/trips"] });
      onTripUpdated(updatedTrip);
      toast({
        title: "Viagem atualizada!",
        description: "As informações da viagem foram atualizadas com sucesso.",
      });
      onClose();
    },
    onError: (error) => {
      console.error("Error updating trip:", error);
      toast({
        title: "Erro ao atualizar viagem",
        description: "Ocorreu um erro ao atualizar a viagem. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: EditTripForm) => {
    setIsLoading(true);
    updateTripMutation.mutate(data);
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  if (!trip) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <MapPin className="w-5 h-5 text-blue-600" />
            Editar Viagem
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Trip Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Heart className="w-4 h-4" />
                    Nome da Viagem
                  </FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Ex: Férias no Rio de Janeiro" 
                      {...field}
                      className="bg-white/95 border-gray-300 focus:border-blue-500"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Destination */}
            <FormField
              control={form.control}
              name="destination"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Destino
                  </FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Ex: Rio de Janeiro, RJ" 
                      {...field}
                      className="bg-white/95 border-gray-300 focus:border-blue-500"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Data de Início
                    </FormLabel>
                    <FormControl>
                      <Input 
                        type="date" 
                        {...field}
                        className="bg-white/95 border-gray-300 focus:border-blue-500"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Data de Fim
                    </FormLabel>
                    <FormControl>
                      <Input 
                        type="date" 
                        {...field}
                        className="bg-white/95 border-gray-300 focus:border-blue-500"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Budget */}
            <FormField
              control={form.control}
              name="budget"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    Orçamento (R$)
                  </FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      placeholder="Ex: 3000" 
                      {...field}
                      className="bg-white/95 border-gray-300 focus:border-blue-500"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Preferences */}
            <FormField
              control={form.control}
              name="preferences"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Preferências e Observações</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Ex: Praias, museus, vida noturna, restaurantes locais..."
                      rows={4}
                      {...field}
                      className="bg-white/95 border-gray-300 focus:border-blue-500"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Current Travel Style Display */}
            {trip.travelStyle && trip.travelStyle.length > 0 && (
              <div className="p-4 bg-blue-50 rounded-lg">
                <Label className="text-sm font-medium text-blue-900">Estilo de Viagem Atual:</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {trip.travelStyle.map((style, index) => (
                    <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                      {style}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-blue-700 mt-2">
                  Para alterar o estilo de viagem, será necessário gerar um novo itinerário.
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isLoading}
              >
                <X className="w-4 h-4 mr-2" />
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Salvar Alterações
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}