import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { insertTripSchema } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { CalendarDays, MapPin, DollarSign, Users, ArrowRight, Sparkles, Mountain, Camera, Utensils, Waves, CheckCircle, Cog, Heart } from "lucide-react";
import { GlassCard } from "@/components/GlassCard";

const createTripSchema = insertTripSchema.extend({
  startDate: z.string().min(1, "Data de início é obrigatória"),
  endDate: z.string().min(1, "Data de fim é obrigatória"),
  cities: z.string().min(1, "Pelo menos uma cidade é obrigatória"),
  activities: z.string().min(1, "Descreva o que deseja fazer"),
  avoidances: z.string().optional(),
});

type CreateTripFormData = z.infer<typeof createTripSchema>;

interface CreateTripProps {
  onNavigate: (section: string) => void;
}

export function CreateTrip({ onNavigate }: CreateTripProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
  const [editingTrip, setEditingTrip] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Check if we're editing an existing trip
  useEffect(() => {
    const storedTrip = localStorage.getItem('editingTrip');
    if (storedTrip) {
      const trip = JSON.parse(storedTrip);
      setEditingTrip(trip);
      setSelectedStyles(trip.travelStyle || []);
      localStorage.removeItem('editingTrip');
    }
  }, []);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<CreateTripFormData>({
    resolver: zodResolver(createTripSchema),
    defaultValues: editingTrip ? {
      name: editingTrip.name,
      destination: editingTrip.destination,
      budget: editingTrip.budget,
      preferences: editingTrip.preferences,
      startDate: editingTrip.startDate?.split('T')[0],
      endDate: editingTrip.endDate?.split('T')[0],
      cities: editingTrip.cities,
      activities: editingTrip.activities,
      avoidances: editingTrip.avoidances,
    } : {},
  });

  const createTripMutation = useMutation({
    mutationFn: async (data: CreateTripFormData) => {
      const response = await apiRequest("/api/trips", {
        method: "POST",
        body: JSON.stringify({
          ...data,
          startDate: new Date(data.startDate),
          endDate: new Date(data.endDate),
          travelStyle: selectedStyles,
        }),
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trips"] });
      toast({
        title: "Viagem criada com sucesso!",
        description: "Sua viagem foi salva e está pronta para planejamento.",
      });
      onNavigate("my-trips");
    },
    onError: () => {
      toast({
        title: "Erro ao criar viagem",
        description: "Por favor, tente novamente.",
        variant: "destructive",
      });
    },
  });

  const travelStyles = [
    { id: "aventura", label: "Aventura", icon: Mountain },
    { id: "fotografia", label: "Fotografia", icon: Camera },
    { id: "gastronomia", label: "Gastronomia", icon: Utensils },
    { id: "relaxamento", label: "Relaxamento", icon: Waves },
    { id: "cultural", label: "Cultural", icon: CheckCircle },
    { id: "negócios", label: "Negócios", icon: Cog },
    { id: "família", label: "Família", icon: Users },
    { id: "romântico", label: "Romântico", icon: Heart },
    { id: "econômico", label: "Econômico", icon: DollarSign },
    { id: "luxo", label: "Luxo", icon: Sparkles },
    { id: "esportivo", label: "Esportivo", icon: Mountain },
    { id: "wellness", label: "Wellness", icon: Waves },
  ];

  const toggleStyle = (styleId: string) => {
    setSelectedStyles(prev =>
      prev.includes(styleId)
        ? prev.filter(s => s !== styleId)
        : [...prev, styleId]
    );
  };

  const onSubmit = async (data: CreateTripFormData) => {
    setIsGenerating(true);
    
    try {
      // Gerar itinerário com IA
      const response = await fetch("/api/trips/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          destination: data.destination,
          cities: data.cities,
          startDate: data.startDate,
          endDate: data.endDate,
          budget: data.budget,
          travelStyle: selectedStyles,
          preferences: data.preferences,
          activities: data.activities,
          avoidances: data.avoidances,
        }),
      });
      
      if (!response.ok) {
        throw new Error("Falha na geração com IA");
      }
      
      const aiData = await response.json();

      // Criar viagem com dados gerados pela IA
      await createTripMutation.mutateAsync({
        ...data,
        travelStyle: selectedStyles,
      });

    } catch (error) {
      console.error("Falha na geração com IA:", error);
      // Ainda criar a viagem sem dados da IA
      await createTripMutation.mutateAsync({
        ...data,
        travelStyle: selectedStyles,
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 pb-20 md:pb-8">
      <div className="max-w-2xl mx-auto">
        <GlassCard className="p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">
              {editingTrip ? "Editar Viagem" : "Criar Sua Viagem Perfeita"}
            </h1>
            <p className="text-white/80">
              {editingTrip ? "Modifique os detalhes da sua viagem" : "Deixe nosso assistente IA ajudar você a planejar uma jornada inesquecível"}
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="name" className="text-white font-semibold">
                  Nome da Viagem
                </Label>
                <Input
                  id="name"
                  placeholder="ex: Minha Aventura Incrível"
                  className="bg-black/30 border-white/20 text-white placeholder-white/60 font-medium"
                  {...register("name")}
                />
                {errors.name && (
                  <p className="text-red-300 text-sm mt-1 font-medium">{errors.name.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="destination" className="text-white font-semibold">
                  Destino Principal
                </Label>
                <Input
                  id="destination"
                  placeholder="ex: França, Brasil, Japão"
                  className="bg-black/30 border-white/20 text-white placeholder-white/60 font-medium"
                  {...register("destination")}
                />
                {errors.destination && (
                  <p className="text-red-300 text-sm mt-1 font-medium">{errors.destination.message}</p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="cities" className="text-white font-semibold">
                Cidades que deseja visitar
              </Label>
              <Input
                id="cities"
                placeholder="ex: Paris, Lyon, Nice ou São Paulo, Rio de Janeiro, Salvador"
                className="bg-black/30 border-white/20 text-white placeholder-white/60 font-medium"
                {...register("cities")}
              />
              {errors.cities && (
                <p className="text-red-300 text-sm mt-1 font-medium">{errors.cities.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="startDate" className="text-white font-semibold">
                  Data de Início
                </Label>
                <Input
                  id="startDate"
                  type="date"
                  className="bg-black/30 border-white/20 text-white font-medium"
                  {...register("startDate")}
                />
                {errors.startDate && (
                  <p className="text-red-300 text-sm mt-1 font-medium">{errors.startDate.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="endDate" className="text-white font-semibold">
                  Data de Fim
                </Label>
                <Input
                  id="endDate"
                  type="date"
                  className="bg-black/30 border-white/20 text-white font-medium"
                  {...register("endDate")}
                />
                {errors.endDate && (
                  <p className="text-red-300 text-sm mt-1 font-medium">{errors.endDate.message}</p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="budget" className="text-white font-semibold">
                Orçamento (R$)
              </Label>
              <Input
                id="budget"
                placeholder="ex: 5000"
                className="bg-black/30 border-white/20 text-white placeholder-white/60 font-medium"
                {...register("budget")}
              />
              {errors.budget && (
                <p className="text-red-300 text-sm mt-1 font-medium">{errors.budget.message}</p>
              )}
            </div>

            <div>
              <Label className="text-white font-semibold mb-4 block">
                Estilo de Viagem
              </Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {travelStyles.map((style) => {
                  const IconComponent = style.icon;
                  return (
                    <button
                      key={style.id}
                      type="button"
                      onClick={() => toggleStyle(style.id)}
                      className={`p-3 rounded-lg border transition-all ${
                        selectedStyles.includes(style.id)
                          ? "bg-black/50 border-white/50 text-white shadow-lg"
                          : "bg-black/25 border-white/25 text-white/80 hover:bg-black/40 hover:text-white"
                      }`}
                    >
                      <IconComponent className="w-6 h-6 mx-auto mb-1" />
                      <span className="text-sm font-medium">{style.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <Label htmlFor="activities" className="text-white font-semibold">
                O que você quer fazer?
              </Label>
              <Textarea
                id="activities"
                placeholder="Descreva as atividades que deseja fazer: museus, restaurantes, vida noturna, esportes, compras, etc."
                className="bg-black/30 border-white/20 text-white placeholder-white/60 min-h-[100px] font-medium"
                {...register("activities")}
              />
              {errors.activities && (
                <p className="text-red-300 text-sm mt-1 font-medium">{errors.activities.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="avoidances" className="text-white font-semibold">
                O que você quer evitar? (opcional)
              </Label>
              <Textarea
                id="avoidances"
                placeholder="Coisas que prefere evitar: multidões, lugares muito turísticos, comida picante, etc."
                className="bg-black/30 border-white/20 text-white placeholder-white/60 min-h-[80px] font-medium"
                {...register("avoidances")}
              />
              {errors.avoidances && (
                <p className="text-red-300 text-sm mt-1 font-medium">{errors.avoidances.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="preferences" className="text-white font-semibold">
                Preferências e Observações
              </Label>
              <Textarea
                id="preferences"
                placeholder="Conte-nos sobre suas preferências de viagem, restrições alimentares, necessidades de acessibilidade, etc."
                className="bg-black/30 border-white/20 text-white placeholder-white/60 min-h-[100px] font-medium"
                {...register("preferences")}
              />
              {errors.preferences && (
                <p className="text-red-300 text-sm mt-1 font-medium">{errors.preferences.message}</p>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onNavigate("dashboard")}
                className="flex-1 bg-black/30 border-white/20 text-white hover:bg-black/40 font-medium"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isGenerating}
                className="flex-1 bg-gradient-to-r from-gray-800 to-gray-900 text-white hover:from-gray-700 hover:to-gray-800"
              >
                {isGenerating ? (
                  <>
                    <Sparkles className="mr-2 h-4 w-4 animate-spin" />
                    Gerando com IA...
                  </>
                ) : (
                  <>
                    <ArrowRight className="mr-2 h-4 w-4" />
                    Criar Viagem
                  </>
                )}
              </Button>
            </div>
          </form>
        </GlassCard>
      </div>
    </div>
  );
}