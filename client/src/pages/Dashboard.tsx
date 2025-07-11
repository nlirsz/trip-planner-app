import { useQuery } from "@tanstack/react-query";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { MapPin, Globe, Calendar, FileText, Plus, List, Upload, Plane, DollarSign, CheckSquare, AlertTriangle, Clock, TrendingUp, Users, Sparkles } from "lucide-react";
import { Trip } from "@shared/schema";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface DashboardProps {
  onNavigate: (section: string) => void;
}

export function Dashboard({ onNavigate }: DashboardProps) {
  const { data: trips = [], isLoading } = useQuery<Trip[]>({
    queryKey: ["/api/trips"],
  });

  const { data: user } = useQuery({
    queryKey: ["/api/user"],
  });

  const upcomingTrips = trips.filter(trip => trip.status === "upcoming" || trip.status === "planning");
  const completedTrips = trips.filter(trip => trip.status === "completed");

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-8">
          <div className="h-20 bg-white/20 rounded-2xl"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-32 bg-white/20 rounded-2xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 pb-20 md:pb-8">
      <div className="mb-8 animate-fadeIn">
        <h2 className="text-3xl font-bold text-white mb-2">
          Bem-vindo, {user?.name || "Viajante"}!
        </h2>
        <p className="text-white/70">Visão geral completa das suas viagens</p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <GlassCard hover className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/80 text-sm font-medium">Viagens Ativas</p>
              <p className="text-2xl font-bold text-white">{upcomingTrips.length}</p>
            </div>
            <div className="w-12 h-12 bg-[#667EEA]/30 rounded-xl flex items-center justify-center">
              <MapPin className="w-6 h-6 text-[#667EEA]" />
            </div>
          </div>
        </GlassCard>
        
        <GlassCard hover className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/80 text-sm font-medium">Gasto Total</p>
              <p className="text-2xl font-bold text-white">R$ 2.450</p>
            </div>
            <div className="w-12 h-12 bg-[#48BB78]/30 rounded-xl flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-[#48BB78]" />
            </div>
          </div>
        </GlassCard>
        
        <GlassCard hover className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/80 text-sm font-medium">Documentos</p>
              <p className="text-2xl font-bold text-white">8/12</p>
            </div>
            <div className="w-12 h-12 bg-[#ED8936]/30 rounded-xl flex items-center justify-center">
              <FileText className="w-6 h-6 text-[#ED8936]" />
            </div>
          </div>
        </GlassCard>
        
        <GlassCard hover className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/80 text-sm font-medium">Checklist</p>
              <p className="text-2xl font-bold text-white">75%</p>
            </div>
            <div className="w-12 h-12 bg-[#9F7AEA]/30 rounded-xl flex items-center justify-center">
              <CheckSquare className="w-6 h-6 text-[#9F7AEA]" />
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Current Trip Status */}
      <div className="mb-8">
        <h3 className="text-xl font-bold text-white mb-4">Status da Viagem Atual</h3>
        <GlassCard className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h4 className="text-lg font-semibold text-white mb-4">Próxima Viagem</h4>
              {upcomingTrips.length > 0 ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-white/80 font-medium">Destino:</span>
                    <span className="font-semibold text-white">{upcomingTrips[0].destination}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-white/80 font-medium">Data:</span>
                    <span className="font-semibold text-white">
                      {format(new Date(upcomingTrips[0].startDate), "dd/MM/yyyy", { locale: ptBR })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-white/80 font-medium">Dias restantes:</span>
                    <Badge variant="outline" className="bg-blue-100 text-blue-800">
                      {Math.ceil((new Date(upcomingTrips[0].startDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} dias
                    </Badge>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Plus className="w-12 h-12 text-white/60 mx-auto mb-4" />
                  <p className="text-white/80 mb-4">Nenhuma viagem programada</p>
                  <Button 
                    className="bg-[#667EEA] hover:bg-[#667EEA]/90 text-white"
                    onClick={() => onNavigate("my-trips")}
                  >
                    Criar Primeira Viagem
                  </Button>
                </div>
              )}
            </div>
            
            <div>
              <h4 className="text-lg font-semibold text-white mb-4">Progresso dos Preparativos</h4>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-white/80 font-medium">Documentos</span>
                    <span className="text-sm font-medium text-white">8/12</span>
                  </div>
                  <Progress value={67} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-white/80 font-medium">Checklist de Mala</span>
                    <span className="text-sm font-medium text-white">18/24</span>
                  </div>
                  <Progress value={75} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-white/80 font-medium">Reservas</span>
                    <span className="text-sm font-medium text-white">3/5</span>
                  </div>
                  <Progress value={60} className="h-2" />
                </div>
              </div>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Quick Actions Grid */}
      <div className="mb-8">
        <h3 className="text-xl font-bold text-white mb-4">Acesso Rápido</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <GlassCard hover className="p-4 cursor-pointer text-center" onClick={() => onNavigate("my-trips")}>
            <div className="w-12 h-12 bg-[#667EEA]/20 rounded-xl flex items-center justify-center mx-auto mb-3">
              <List className="w-6 h-6 text-[#667EEA]" />
            </div>
            <h4 className="font-semibold text-[#1A202C] text-sm">Viagens</h4>
          </GlassCard>
          
          <GlassCard hover className="p-4 cursor-pointer text-center" onClick={() => onNavigate("flight-details")}>
            <div className="w-12 h-12 bg-[#667EEA]/20 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Plane className="w-6 h-6 text-[#667EEA]" />
            </div>
            <h4 className="font-semibold text-[#1A202C] text-sm">Voos</h4>
          </GlassCard>
          
          <GlassCard hover className="p-4 cursor-pointer text-center" onClick={() => onNavigate("accommodations")}>
            <div className="w-12 h-12 bg-[#48BB78]/20 rounded-xl flex items-center justify-center mx-auto mb-3">
              <MapPin className="w-6 h-6 text-[#48BB78]" />
            </div>
            <h4 className="font-semibold text-[#1A202C] text-sm">Hotéis</h4>
          </GlassCard>
          
          <GlassCard hover className="p-4 cursor-pointer text-center" onClick={() => onNavigate("itinerary")}>
            <div className="w-12 h-12 bg-[#ED8936]/20 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Calendar className="w-6 h-6 text-[#ED8936]" />
            </div>
            <h4 className="font-semibold text-[#1A202C] text-sm">Roteiro</h4>
          </GlassCard>
          
          <GlassCard hover className="p-4 cursor-pointer text-center" onClick={() => onNavigate("packing")}>
            <div className="w-12 h-12 bg-[#9F7AEA]/20 rounded-xl flex items-center justify-center mx-auto mb-3">
              <CheckSquare className="w-6 h-6 text-[#9F7AEA]" />
            </div>
            <h4 className="font-semibold text-[#1A202C] text-sm">Mala</h4>
          </GlassCard>
          
          <GlassCard hover className="p-4 cursor-pointer text-center" onClick={() => onNavigate("expenses")}>
            <div className="w-12 h-12 bg-[#48BB78]/20 rounded-xl flex items-center justify-center mx-auto mb-3">
              <DollarSign className="w-6 h-6 text-[#48BB78]" />
            </div>
            <h4 className="font-semibold text-[#1A202C] text-sm">Gastos</h4>
          </GlassCard>
          
          <GlassCard hover className="p-4 cursor-pointer text-center" onClick={() => onNavigate("travel-docs")}>
            <div className="w-12 h-12 bg-[#ED8936]/20 rounded-xl flex items-center justify-center mx-auto mb-3">
              <FileText className="w-6 h-6 text-[#ED8936]" />
            </div>
            <h4 className="font-semibold text-[#1A202C] text-sm">Documentos</h4>
          </GlassCard>
          
          <GlassCard hover className="p-4 cursor-pointer text-center" onClick={() => onNavigate("create-trip")}>
            <div className="w-12 h-12 bg-[#F093FB]/20 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Plus className="w-6 h-6 text-[#F093FB]" />
            </div>
            <h4 className="font-semibold text-[#1A202C] text-sm">Nova Viagem</h4>
          </GlassCard>
        </div>
      </div>

      {/* Alerts and Notifications */}
      <div className="mb-8">
        <h3 className="text-xl font-bold text-white mb-4">Alertas Importantes</h3>
        <div className="space-y-4">
          <GlassCard className="p-4 border-l-4 border-yellow-400">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
              <div>
                <h4 className="font-semibold text-[#1A202C]">Documento Vencendo</h4>
                <p className="text-sm text-[#1A202C]/60">Seu passaporte vence em 3 meses. Considere renovar antes da viagem.</p>
              </div>
            </div>
          </GlassCard>
          
          <GlassCard className="p-4 border-l-4 border-green-400">
            <div className="flex items-center space-x-3">
              <Sparkles className="w-5 h-5 text-green-600" />
              <div>
                <h4 className="font-semibold text-[#1A202C]">Sugestão da IA</h4>
                <p className="text-sm text-[#1A202C]/60">Novos hotéis recomendados para São Paulo com base no seu perfil.</p>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="mb-8">
        <h3 className="text-xl font-bold text-white mb-4">Atividade Recente</h3>
        <GlassCard className="p-6">
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-[#667EEA]/20 rounded-full flex items-center justify-center">
                <Plus className="w-5 h-5 text-[#667EEA]" />
              </div>
              <div>
                <p className="font-semibold text-[#1A202C]">Viagem criada</p>
                <p className="text-sm text-[#1A202C]/60">Escapada para São Paulo • hoje</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-[#48BB78]/20 rounded-full flex items-center justify-center">
                <CheckSquare className="w-5 h-5 text-[#48BB78]" />
              </div>
              <div>
                <p className="font-semibold text-[#1A202C]">Checklist atualizado</p>
                <p className="text-sm text-[#1A202C]/60">5 itens marcados como prontos • 2 horas atrás</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-[#F093FB]/20 rounded-full flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-[#F093FB]" />
              </div>
              <div>
                <p className="font-semibold text-[#1A202C]">IA gerou sugestões</p>
                <p className="text-sm text-[#1A202C]/60">Roteiro personalizado criado • ontem</p>
              </div>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
