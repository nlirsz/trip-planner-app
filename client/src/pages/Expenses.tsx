import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DollarSign, TrendingUp, TrendingDown, PieChart, Plus, CreditCard, Utensils, ShoppingBag, Car, MapPin, Calendar } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ExpensesProps {
  onNavigate: (section: string) => void;
}

export function Expenses({ onNavigate }: ExpensesProps) {
  const [selectedTrip, setSelectedTrip] = useState<number | null>(null);
  const [timeFilter, setTimeFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const { data: trips = [], isLoading } = useQuery({
    queryKey: ["/api/trips"],
    enabled: true,
  });

  const { data: expenses = [] } = useQuery({
    queryKey: ["/api/expenses", selectedTrip],
    enabled: !!selectedTrip,
  });

  // Demo data for Wise integration
  const wiseData = {
    totalBalance: "R$ 2.450,00",
    totalSpent: "R$ 1.350,00",
    dailyAverage: "R$ 270,00",
    remainingBudget: "R$ 1.100,00",
    transactions: [
      { id: 1, date: "2024-01-15", description: "Restaurante italiano", amount: "-R$ 85,00", category: "food", city: "São Paulo" },
      { id: 2, date: "2024-01-15", description: "Uber", amount: "-R$ 25,00", category: "transport", city: "São Paulo" },
      { id: 3, date: "2024-01-14", description: "Souvenirs", amount: "-R$ 150,00", category: "shopping", city: "São Paulo" },
      { id: 4, date: "2024-01-14", description: "Hotel", amount: "-R$ 320,00", category: "accommodation", city: "São Paulo" },
      { id: 5, date: "2024-01-13", description: "Museu", amount: "-R$ 40,00", category: "entertainment", city: "São Paulo" },
    ]
  };

  const categoryStats = {
    food: { total: "R$ 450,00", percentage: 33, color: "bg-orange-500" },
    transport: { total: "R$ 200,00", percentage: 15, color: "bg-blue-500" },
    shopping: { total: "R$ 300,00", percentage: 22, color: "bg-purple-500" },
    accommodation: { total: "R$ 320,00", percentage: 24, color: "bg-green-500" },
    entertainment: { total: "R$ 80,00", percentage: 6, color: "bg-pink-500" },
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "food": return <Utensils className="w-4 h-4" />;
      case "transport": return <Car className="w-4 h-4" />;
      case "shopping": return <ShoppingBag className="w-4 h-4" />;
      case "accommodation": return <MapPin className="w-4 h-4" />;
      case "entertainment": return <Calendar className="w-4 h-4" />;
      default: return <DollarSign className="w-4 h-4" />;
    }
  };

  const getCategoryName = (category: string) => {
    switch (category) {
      case "food": return "Alimentação";
      case "transport": return "Transporte";
      case "shopping": return "Compras";
      case "accommodation": return "Hospedagem";
      case "entertainment": return "Entretenimento";
      default: return category;
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-white">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 pb-20 md:pb-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">Controle de Gastos</h2>
        <p className="text-white/70">Integração com Wise para controle financeiro completo</p>
      </div>

      {/* Trip Selection */}
      <div className="mb-6">
        <GlassCard className="p-6">
          <h3 className="text-xl font-semibold text-[#1A202C] mb-4">Selecione uma Viagem</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {trips.map((trip: any) => (
              <button
                key={trip.id}
                onClick={() => setSelectedTrip(trip.id)}
                className={`p-4 rounded-lg border-2 transition-all ${
                  selectedTrip === trip.id
                    ? "border-[#667EEA] bg-[#667EEA]/10"
                    : "border-gray-200 hover:border-[#667EEA]/50"
                }`}
              >
                <div className="text-left">
                  <h4 className="font-semibold text-[#1A202C]">{trip.name}</h4>
                  <p className="text-sm text-gray-600">{trip.destination}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {format(new Date(trip.startDate), "dd/MM/yyyy", { locale: ptBR })} - {format(new Date(trip.endDate), "dd/MM/yyyy", { locale: ptBR })}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </GlassCard>
      </div>

      {selectedTrip && (
        <div className="space-y-6">
          {/* Wise Integration Status */}
          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <CreditCard className="w-5 h-5 text-[#667EEA]" />
                <h3 className="text-xl font-semibold text-[#1A202C]">Conexão Wise</h3>
                <Badge variant="outline" className="bg-green-100 text-green-800">Conectado</Badge>
              </div>
              <Button size="sm" variant="outline">
                Configurar
              </Button>
            </div>
            <p className="text-sm text-gray-600">
              Seus gastos estão sendo sincronizados automaticamente com sua conta Wise
            </p>
          </GlassCard>

          {/* Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <GlassCard className="p-6">
              <div className="flex items-center justify-between mb-2">
                <div className="text-2xl font-bold text-[#1A202C]">{wiseData.totalBalance}</div>
                <div className="p-2 bg-green-100 rounded-lg">
                  <DollarSign className="w-5 h-5 text-green-600" />
                </div>
              </div>
              <p className="text-sm text-gray-600">Saldo Total</p>
            </GlassCard>

            <GlassCard className="p-6">
              <div className="flex items-center justify-between mb-2">
                <div className="text-2xl font-bold text-[#1A202C]">{wiseData.totalSpent}</div>
                <div className="p-2 bg-red-100 rounded-lg">
                  <TrendingDown className="w-5 h-5 text-red-600" />
                </div>
              </div>
              <p className="text-sm text-gray-600">Gasto Total</p>
            </GlassCard>

            <GlassCard className="p-6">
              <div className="flex items-center justify-between mb-2">
                <div className="text-2xl font-bold text-[#1A202C]">{wiseData.dailyAverage}</div>
                <div className="p-2 bg-blue-100 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                </div>
              </div>
              <p className="text-sm text-gray-600">Média Diária</p>
            </GlassCard>

            <GlassCard className="p-6">
              <div className="flex items-center justify-between mb-2">
                <div className="text-2xl font-bold text-[#1A202C]">{wiseData.remainingBudget}</div>
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <PieChart className="w-5 h-5 text-yellow-600" />
                </div>
              </div>
              <p className="text-sm text-gray-600">Orçamento Restante</p>
            </GlassCard>
          </div>

          {/* Category Breakdown */}
          <GlassCard className="p-6">
            <h3 className="text-xl font-semibold text-[#1A202C] mb-4">Gastos por Categoria</h3>
            <div className="space-y-4">
              {Object.entries(categoryStats).map(([category, stats]) => (
                <div key={category} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-white rounded-lg">
                      {getCategoryIcon(category)}
                    </div>
                    <div>
                      <div className="font-semibold text-[#1A202C]">{getCategoryName(category)}</div>
                      <div className="text-sm text-gray-600">{stats.percentage}% do total</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-[#1A202C]">{stats.total}</div>
                    <div className="w-20 h-2 bg-gray-200 rounded-full mt-1">
                      <div 
                        className={`h-2 rounded-full ${stats.color}`}
                        style={{ width: `${stats.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>

          {/* Filters */}
          <div className="flex flex-wrap gap-4">
            <Select value={timeFilter} onValueChange={setTimeFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrar por período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os períodos</SelectItem>
                <SelectItem value="today">Hoje</SelectItem>
                <SelectItem value="week">Esta semana</SelectItem>
                <SelectItem value="month">Este mês</SelectItem>
              </SelectContent>
            </Select>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrar por categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as categorias</SelectItem>
                <SelectItem value="food">Alimentação</SelectItem>
                <SelectItem value="transport">Transporte</SelectItem>
                <SelectItem value="shopping">Compras</SelectItem>
                <SelectItem value="accommodation">Hospedagem</SelectItem>
                <SelectItem value="entertainment">Entretenimento</SelectItem>
              </SelectContent>
            </Select>

            <Button className="bg-[#667EEA] hover:bg-[#667EEA]/90">
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Gasto
            </Button>
          </div>

          {/* Recent Transactions */}
          <GlassCard className="p-6">
            <h3 className="text-xl font-semibold text-[#1A202C] mb-4">Transações Recentes</h3>
            <div className="space-y-3">
              {wiseData.transactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      {getCategoryIcon(transaction.category)}
                    </div>
                    <div>
                      <div className="font-semibold text-[#1A202C]">{transaction.description}</div>
                      <div className="text-sm text-gray-600 flex items-center">
                        <MapPin className="w-3 h-3 mr-1" />
                        {transaction.city} • {format(new Date(transaction.date), "dd/MM/yyyy", { locale: ptBR })}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-red-600">{transaction.amount}</div>
                    <Badge variant="outline" className="text-xs">
                      {getCategoryName(transaction.category)}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>

          {/* City Breakdown */}
          <GlassCard className="p-6">
            <h3 className="text-xl font-semibold text-[#1A202C] mb-4">Gastos por Cidade</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <MapPin className="w-5 h-5 text-blue-600" />
                  <div>
                    <div className="font-semibold text-blue-900">São Paulo</div>
                    <div className="text-sm text-blue-700">5 transações</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-blue-900">R$ 1.350,00</div>
                  <div className="text-sm text-blue-700">100% do total</div>
                </div>
              </div>
            </div>
          </GlassCard>

          {/* Budget Alert */}
          <GlassCard className="p-6 border-l-4 border-yellow-400">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <TrendingUp className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <h4 className="font-semibold text-yellow-900">Alerta de Orçamento</h4>
                <p className="text-sm text-yellow-800">
                  Você gastou 55% do seu orçamento total. Considere ajustar os gastos para os próximos dias.
                </p>
              </div>
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
}