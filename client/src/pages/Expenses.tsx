import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { GlassCard } from "@/components/GlassCard";
import { apiRequest } from "@/lib/queryClient";
import { 
  wiseApi, 
  isWiseConfigured, 
  getTravelExpenses, 
  categorizeExpenses, 
  calculateTotalExpenses,
  formatCurrency,
  WiseTransaction 
} from "@/lib/wise";
import { 
  DollarSign, 
  CreditCard, 
  PieChart, 
  TrendingUp, 
  AlertCircle,
  Home,
  Utensils,
  Car,
  ShoppingBag,
  Music,
  Plus,
  ExternalLink,
  Download
} from "lucide-react";

interface ExpensesProps {
  onNavigate: (section: string) => void;
}

export function Expenses({ onNavigate }: ExpensesProps) {
  const [selectedTrip, setSelectedTrip] = useState<number | null>(null);
  const [newExpense, setNewExpense] = useState({
    amount: "",
    category: "",
    description: "",
    date: "",
  });
  const [wiseExpenses, setWiseExpenses] = useState<WiseTransaction[]>([]);
  const [isLoadingWise, setIsLoadingWise] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Buscar viagens
  const { data: trips = [] } = useQuery({
    queryKey: ["/api/trips"],
  });

  // Buscar gastos da viagem selecionada
  const { data: expenses = [] } = useQuery({
    queryKey: ["/api/trips", selectedTrip, "expenses"],
    enabled: !!selectedTrip,
  });

  // Buscar gastos da Wise
  const loadWiseExpenses = async (tripId: number) => {
    if (!isWiseConfigured()) {
      toast({
        title: "Wise API não configurada",
        description: "Configure sua API key da Wise para sincronizar gastos automaticamente.",
        variant: "destructive",
      });
      return;
    }

    setIsLoadingWise(true);
    try {
      const trip = trips.find(t => t.id === tripId);
      if (!trip) return;

      const profiles = await wiseApi.getProfiles();
      if (profiles.length === 0) {
        toast({
          title: "Nenhum perfil encontrado",
          description: "Verifique suas credenciais da Wise.",
          variant: "destructive",
        });
        return;
      }

      const travelExpenses = await getTravelExpenses(
        profiles[0].id,
        trip.startDate,
        trip.endDate,
        "BRL"
      );

      setWiseExpenses(travelExpenses);
      
      toast({
        title: "Gastos sincronizados",
        description: `${travelExpenses.length} transações encontradas da Wise.`,
      });
    } catch (error) {
      console.error("Erro ao carregar gastos da Wise:", error);
      toast({
        title: "Erro ao sincronizar",
        description: "Não foi possível carregar os gastos da Wise.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingWise(false);
    }
  };

  // Adicionar gasto manual
  const addExpenseMutation = useMutation({
    mutationFn: async (expenseData: any) => {
      return apiRequest("/api/expenses", {
        method: "POST",
        body: JSON.stringify({
          ...expenseData,
          tripId: selectedTrip,
          amount: parseFloat(expenseData.amount),
          date: new Date(expenseData.date),
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trips", selectedTrip, "expenses"] });
      setNewExpense({ amount: "", category: "", description: "", date: "" });
      toast({
        title: "Gasto adicionado",
        description: "Gasto registrado com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro ao adicionar gasto",
        description: "Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const handleAddExpense = () => {
    if (!selectedTrip || !newExpense.amount || !newExpense.category || !newExpense.description) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    addExpenseMutation.mutate(newExpense);
  };

  // Categorizar gastos
  const categorizedExpenses = categorizeExpenses(wiseExpenses);
  const totalWiseExpenses = wiseExpenses.reduce((sum, expense) => sum + Math.abs(expense.amount.value), 0);
  const totalManualExpenses = expenses.reduce((sum, expense) => sum + (expense.amount || 0), 0);

  const categoryIcons = {
    accommodation: Home,
    food: Utensils,
    transportation: Car,
    entertainment: Music,
    shopping: ShoppingBag,
    others: DollarSign,
  };

  const categoryLabels = {
    accommodation: "Hospedagem",
    food: "Alimentação",
    transportation: "Transporte",
    entertainment: "Entretenimento",
    shopping: "Compras",
    others: "Outros",
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Controle de Gastos</h1>
          <p className="text-white/70">Gerencie seus gastos de viagem com integração Wise</p>
        </div>

        {/* Seletor de Viagem */}
        <GlassCard className="mb-6">
          <CardHeader>
            <CardTitle className="text-white">Selecionar Viagem</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-white">Viagem</Label>
                <Select
                  value={selectedTrip?.toString()}
                  onValueChange={(value) => setSelectedTrip(parseInt(value))}
                >
                  <SelectTrigger className="bg-white/10 border-white/20 text-white">
                    <SelectValue placeholder="Selecione uma viagem" />
                  </SelectTrigger>
                  <SelectContent>
                    {trips.map((trip: any) => (
                      <SelectItem key={trip.id} value={trip.id.toString()}>
                        {trip.name} - {trip.destination}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {selectedTrip && (
                <div className="flex items-end">
                  <Button
                    onClick={() => loadWiseExpenses(selectedTrip)}
                    disabled={isLoadingWise}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {isLoadingWise ? (
                      <>
                        <AlertCircle className="mr-2 h-4 w-4 animate-spin" />
                        Sincronizando...
                      </>
                    ) : (
                      <>
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Sincronizar Wise
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </GlassCard>

        {selectedTrip && (
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="bg-white/10 border-white/20">
              <TabsTrigger value="overview" className="text-white">Resumo</TabsTrigger>
              <TabsTrigger value="wise" className="text-white">Wise</TabsTrigger>
              <TabsTrigger value="manual" className="text-white">Manual</TabsTrigger>
              <TabsTrigger value="analytics" className="text-white">Análises</TabsTrigger>
            </TabsList>

            {/* Resumo */}
            <TabsContent value="overview">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <GlassCard>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-white text-lg flex items-center">
                      <CreditCard className="mr-2 h-5 w-5" />
                      Gastos Wise
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-white">
                      {formatCurrency(totalWiseExpenses)}
                    </div>
                    <p className="text-white/70 text-sm">
                      {wiseExpenses.length} transações
                    </p>
                  </CardContent>
                </GlassCard>

                <GlassCard>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-white text-lg flex items-center">
                      <DollarSign className="mr-2 h-5 w-5" />
                      Gastos Manuais
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-white">
                      {formatCurrency(totalManualExpenses)}
                    </div>
                    <p className="text-white/70 text-sm">
                      {expenses.length} registros
                    </p>
                  </CardContent>
                </GlassCard>

                <GlassCard>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-white text-lg flex items-center">
                      <TrendingUp className="mr-2 h-5 w-5" />
                      Total
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-white">
                      {formatCurrency(totalWiseExpenses + totalManualExpenses)}
                    </div>
                    <p className="text-white/70 text-sm">
                      Gastos totais
                    </p>
                  </CardContent>
                </GlassCard>
              </div>

              {/* Gastos por Categoria */}
              <GlassCard>
                <CardHeader>
                  <CardTitle className="text-white">Gastos por Categoria</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {Object.entries(categorizedExpenses).map(([category, transactions]) => {
                      const IconComponent = categoryIcons[category as keyof typeof categoryIcons];
                      const total = transactions.reduce((sum, t) => sum + Math.abs(t.amount.value), 0);
                      
                      return (
                        <div key={category} className="flex items-center space-x-3 p-3 bg-white/5 rounded-lg">
                          <IconComponent className="h-8 w-8 text-blue-400" />
                          <div>
                            <div className="text-white font-medium">
                              {categoryLabels[category as keyof typeof categoryLabels]}
                            </div>
                            <div className="text-white/70 text-sm">
                              {formatCurrency(total)}
                            </div>
                            <div className="text-white/50 text-xs">
                              {transactions.length} transações
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </GlassCard>
            </TabsContent>

            {/* Gastos Wise */}
            <TabsContent value="wise">
              <GlassCard>
                <CardHeader>
                  <CardTitle className="text-white">Transações da Wise</CardTitle>
                </CardHeader>
                <CardContent>
                  {wiseExpenses.length === 0 ? (
                    <div className="text-center py-8">
                      <CreditCard className="h-12 w-12 text-white/50 mx-auto mb-4" />
                      <p className="text-white/70">Nenhuma transação encontrada</p>
                      <p className="text-white/50 text-sm">Sincronize com a Wise para ver suas transações</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {wiseExpenses.map((expense) => (
                        <div key={expense.id} className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                          <div className="flex-1">
                            <div className="font-medium text-white">{expense.description}</div>
                            <div className="text-white/70 text-sm">
                              {new Date(expense.date).toLocaleDateString("pt-BR")}
                            </div>
                            {expense.merchant && (
                              <div className="text-white/50 text-xs">
                                {expense.merchant.name} - {expense.merchant.category}
                              </div>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-white">
                              {formatCurrency(Math.abs(expense.amount.value), expense.amount.currency)}
                            </div>
                            <Badge variant="outline" className="mt-1">
                              {expense.amount.currency}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </GlassCard>
            </TabsContent>

            {/* Gastos Manuais */}
            <TabsContent value="manual">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Adicionar Gasto */}
                <GlassCard>
                  <CardHeader>
                    <CardTitle className="text-white">Adicionar Gasto</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label className="text-white">Valor (R$)</Label>
                      <Input
                        type="number"
                        value={newExpense.amount}
                        onChange={(e) => setNewExpense({...newExpense, amount: e.target.value})}
                        placeholder="0.00"
                        className="bg-white/10 border-white/20 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-white">Categoria</Label>
                      <Select
                        value={newExpense.category}
                        onValueChange={(value) => setNewExpense({...newExpense, category: value})}
                      >
                        <SelectTrigger className="bg-white/10 border-white/20 text-white">
                          <SelectValue placeholder="Selecione uma categoria" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="accommodation">Hospedagem</SelectItem>
                          <SelectItem value="food">Alimentação</SelectItem>
                          <SelectItem value="transportation">Transporte</SelectItem>
                          <SelectItem value="entertainment">Entretenimento</SelectItem>
                          <SelectItem value="shopping">Compras</SelectItem>
                          <SelectItem value="others">Outros</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-white">Descrição</Label>
                      <Input
                        value={newExpense.description}
                        onChange={(e) => setNewExpense({...newExpense, description: e.target.value})}
                        placeholder="Ex: Jantar no restaurante"
                        className="bg-white/10 border-white/20 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-white">Data</Label>
                      <Input
                        type="date"
                        value={newExpense.date}
                        onChange={(e) => setNewExpense({...newExpense, date: e.target.value})}
                        className="bg-white/10 border-white/20 text-white"
                      />
                    </div>
                    <Button
                      onClick={handleAddExpense}
                      disabled={addExpenseMutation.isPending}
                      className="w-full bg-green-600 hover:bg-green-700"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Adicionar Gasto
                    </Button>
                  </CardContent>
                </GlassCard>

                {/* Lista de Gastos Manuais */}
                <GlassCard>
                  <CardHeader>
                    <CardTitle className="text-white">Gastos Registrados</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {expenses.length === 0 ? (
                      <div className="text-center py-8">
                        <DollarSign className="h-12 w-12 text-white/50 mx-auto mb-4" />
                        <p className="text-white/70">Nenhum gasto registrado</p>
                        <p className="text-white/50 text-sm">Adicione seus gastos manualmente</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {expenses.map((expense: any) => (
                          <div key={expense.id} className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                            <div className="flex-1">
                              <div className="font-medium text-white">{expense.description}</div>
                              <div className="text-white/70 text-sm">
                                {new Date(expense.date).toLocaleDateString("pt-BR")}
                              </div>
                              <Badge variant="outline" className="mt-1">
                                {expense.category}
                              </Badge>
                            </div>
                            <div className="text-right">
                              <div className="font-bold text-white">
                                {formatCurrency(expense.amount)}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </GlassCard>
              </div>
            </TabsContent>

            {/* Análises */}
            <TabsContent value="analytics">
              <GlassCard>
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <PieChart className="mr-2 h-5 w-5" />
                    Análises de Gastos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <PieChart className="h-12 w-12 text-white/50 mx-auto mb-4" />
                    <p className="text-white/70">Análises detalhadas em breve</p>
                    <p className="text-white/50 text-sm">Gráficos e relatórios serão implementados</p>
                  </div>
                </CardContent>
              </GlassCard>
            </TabsContent>
          </Tabs>
        )}

        {!selectedTrip && (
          <GlassCard>
            <CardContent className="text-center py-12">
              <DollarSign className="h-16 w-16 text-white/50 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">Selecione uma Viagem</h3>
              <p className="text-white/70 mb-4">Escolha uma viagem para ver e gerenciar seus gastos</p>
              <Button
                onClick={() => onNavigate("create-trip")}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="mr-2 h-4 w-4" />
                Criar Nova Viagem
              </Button>
            </CardContent>
          </GlassCard>
        )}
      </div>
    </div>
  );
}