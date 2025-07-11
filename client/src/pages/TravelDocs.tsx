import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { FileText, CheckCircle2, AlertCircle, Clock, Plus, Shield, Plane, MapPin, Heart } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface TravelDocsProps {
  onNavigate: (section: string) => void;
}

export function TravelDocs({ onNavigate }: TravelDocsProps) {
  const [selectedTrip, setSelectedTrip] = useState<number | null>(null);
  const [checkedDocs, setCheckedDocs] = useState<Set<string>>(new Set());

  const { data: trips = [], isLoading } = useQuery({
    queryKey: ["/api/trips"],
    enabled: true,
  });

  const { data: travelDocuments = [] } = useQuery({
    queryKey: ["/api/travel-documents", selectedTrip],
    enabled: !!selectedTrip,
  });

  const selectedTripData = trips.find((trip: any) => trip.id === selectedTrip);

  const handleDocToggle = (docId: string) => {
    const newChecked = new Set(checkedDocs);
    if (newChecked.has(docId)) {
      newChecked.delete(docId);
    } else {
      newChecked.add(docId);
    }
    setCheckedDocs(newChecked);
  };

  // Demo required documents based on destination
  const requiredDocs = {
    essenciais: [
      { id: "passport", name: "Passaporte", description: "Válido por pelo menos 6 meses", required: true, obtained: true, expires: "2025-12-15" },
      { id: "visa", name: "Visto", description: "Necessário para entrada no país", required: true, obtained: false, expires: null },
      { id: "flight", name: "Passagem aérea", description: "Ida e volta confirmadas", required: true, obtained: true, expires: null },
      { id: "accommodation", name: "Comprovante de hospedagem", description: "Reserva do hotel", required: true, obtained: true, expires: null },
    ],
    saude: [
      { id: "insurance", name: "Seguro viagem", description: "Cobertura mínima recomendada", required: true, obtained: false, expires: null },
      { id: "vaccination", name: "Certificado de vacinação", description: "Febre amarela obrigatória", required: true, obtained: true, expires: "2025-06-10" },
      { id: "medicine", name: "Receitas médicas", description: "Para medicamentos controlados", required: false, obtained: false, expires: null },
    ],
    financeiros: [
      { id: "bank", name: "Cartão de débito/crédito", description: "Para uso internacional", required: true, obtained: true, expires: "2026-08-01" },
      { id: "cash", name: "Dinheiro em espécie", description: "Para emergências", required: false, obtained: false, expires: null },
      { id: "exchange", name: "Comprovante de câmbio", description: "Se aplicável", required: false, obtained: false, expires: null },
    ],
    outros: [
      { id: "license", name: "Carteira de motorista internacional", description: "Para dirigir no exterior", required: false, obtained: false, expires: null },
      { id: "student", name: "Carteirinha de estudante", description: "Para descontos", required: false, obtained: false, expires: null },
      { id: "emergency", name: "Contatos de emergência", description: "Lista com telefones importantes", required: true, obtained: false, expires: null },
    ],
  };

  const getDocIcon = (category: string) => {
    switch (category) {
      case "essenciais": return <FileText className="w-5 h-5" />;
      case "saude": return <Heart className="w-5 h-5" />;
      case "financeiros": return <Shield className="w-5 h-5" />;
      case "outros": return <MapPin className="w-5 h-5" />;
      default: return <FileText className="w-5 h-5" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "essenciais": return "bg-red-100 text-red-800";
      case "saude": return "bg-green-100 text-green-800";
      case "financeiros": return "bg-blue-100 text-blue-800";
      case "outros": return "bg-purple-100 text-purple-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getDocStatus = (doc: any) => {
    if (!doc.required) return "optional";
    if (doc.obtained) {
      if (doc.expires) {
        const expiryDate = new Date(doc.expires);
        const now = new Date();
        const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        if (daysUntilExpiry <= 30) return "expiring";
      }
      return "completed";
    }
    return "missing";
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed": return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      case "expiring": return <Clock className="w-5 h-5 text-yellow-600" />;
      case "missing": return <AlertCircle className="w-5 h-5 text-red-600" />;
      case "optional": return <CheckCircle2 className="w-5 h-5 text-gray-400" />;
      default: return <FileText className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-100 text-green-800";
      case "expiring": return "bg-yellow-100 text-yellow-800";
      case "missing": return "bg-red-100 text-red-800";
      case "optional": return "bg-gray-100 text-gray-600";
      default: return "bg-gray-100 text-gray-600";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "completed": return "Completo";
      case "expiring": return "Vencendo";
      case "missing": return "Pendente";
      case "optional": return "Opcional";
      default: return "Indefinido";
    }
  };

  const getTotalDocs = () => {
    return Object.values(requiredDocs).reduce((total, category) => total + category.length, 0);
  };

  const getCompletedDocs = () => {
    return Object.values(requiredDocs).reduce((total, category) => {
      return total + category.filter(doc => doc.obtained || !doc.required).length;
    }, 0);
  };

  const getRequiredDocs = () => {
    return Object.values(requiredDocs).reduce((total, category) => {
      return total + category.filter(doc => doc.required).length;
    }, 0);
  };

  const getCompletedRequiredDocs = () => {
    return Object.values(requiredDocs).reduce((total, category) => {
      return total + category.filter(doc => doc.required && doc.obtained).length;
    }, 0);
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
        <h2 className="text-3xl font-bold text-white mb-2">Documentos de Viagem</h2>
        <p className="text-white/70">Check-list completo de documentos necessários para sua viagem</p>
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
          {/* Progress Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <GlassCard className="p-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-[#1A202C] mb-2">
                  {getCompletedRequiredDocs()}/{getRequiredDocs()}
                </div>
                <p className="text-sm text-gray-600">Documentos Obrigatórios</p>
                <Progress 
                  value={(getCompletedRequiredDocs() / getRequiredDocs()) * 100} 
                  className="mt-2"
                />
              </div>
            </GlassCard>
            
            <GlassCard className="p-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-[#1A202C] mb-2">
                  {getCompletedDocs()}/{getTotalDocs()}
                </div>
                <p className="text-sm text-gray-600">Total de Documentos</p>
                <Progress 
                  value={(getCompletedDocs() / getTotalDocs()) * 100} 
                  className="mt-2"
                />
              </div>
            </GlassCard>
            
            <GlassCard className="p-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">
                  {Math.round((getCompletedRequiredDocs() / getRequiredDocs()) * 100)}%
                </div>
                <p className="text-sm text-gray-600">Progresso</p>
                <Badge 
                  variant="outline" 
                  className={getCompletedRequiredDocs() === getRequiredDocs() ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}
                >
                  {getCompletedRequiredDocs() === getRequiredDocs() ? "Completo" : "Em Andamento"}
                </Badge>
              </div>
            </GlassCard>
          </div>

          {/* Document Categories */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {Object.entries(requiredDocs).map(([category, docs]) => (
              <GlassCard key={category} className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getCategoryColor(category)}`}>
                      {getDocIcon(category)}
                      <span className="ml-2 capitalize">{category}</span>
                    </div>
                    <Badge variant="outline">
                      {docs.filter(doc => doc.obtained || !doc.required).length}/{docs.length}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-3">
                  {docs.map((doc) => {
                    const status = getDocStatus(doc);
                    return (
                      <div key={doc.id} className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-gray-50 transition-colors">
                        <div className="flex-shrink-0 pt-1">
                          {getStatusIcon(status)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="font-medium text-[#1A202C]">{doc.name}</h4>
                            <Badge variant="outline" className={getStatusColor(status)}>
                              {getStatusText(status)}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{doc.description}</p>
                          
                          {doc.expires && (
                            <p className="text-xs text-gray-500">
                              Válido até: {format(new Date(doc.expires), "dd/MM/yyyy", { locale: ptBR })}
                            </p>
                          )}
                          
                          {doc.required && !doc.obtained && (
                            <div className="mt-2">
                              <Button size="sm" variant="outline" className="text-xs">
                                Marcar como Obtido
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </GlassCard>
            ))}
          </div>

          {/* Country-Specific Requirements */}
          <GlassCard className="p-6">
            <h3 className="text-xl font-semibold text-[#1A202C] mb-4">Requisitos Específicos do Destino</h3>
            <div className="space-y-4">
              <div className="flex items-start space-x-3 p-4 bg-blue-50 rounded-lg">
                <Plane className="w-5 h-5 text-blue-600 mt-1 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-blue-900">Entrada no País</h4>
                  <p className="text-sm text-blue-800">
                    Visto necessário para brasileiros. Processo pode levar até 15 dias úteis.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3 p-4 bg-green-50 rounded-lg">
                <Heart className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-green-900">Saúde</h4>
                  <p className="text-sm text-green-800">
                    Certificado de vacinação contra febre amarela obrigatório. Seguro saúde recomendado.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3 p-4 bg-purple-50 rounded-lg">
                <Shield className="w-5 h-5 text-purple-600 mt-1 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-purple-900">Alfândega</h4>
                  <p className="text-sm text-purple-800">
                    Limite de US$ 500 em compras duty-free. Declaração obrigatória para valores superiores.
                  </p>
                </div>
              </div>
            </div>
          </GlassCard>

          {/* Important Reminders */}
          <GlassCard className="p-6 border-l-4 border-orange-400">
            <h3 className="text-xl font-semibold text-[#1A202C] mb-4">Lembretes Importantes</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <AlertCircle className="w-5 h-5 text-orange-600" />
                <p className="text-sm text-gray-700">
                  <strong>Passaporte:</strong> Deve ter validade mínima de 6 meses a partir da data de entrada
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <Clock className="w-5 h-5 text-orange-600" />
                <p className="text-sm text-gray-700">
                  <strong>Visto:</strong> Pode levar até 15 dias úteis para aprovação
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <Shield className="w-5 h-5 text-orange-600" />
                <p className="text-sm text-gray-700">
                  <strong>Seguro:</strong> Contrate com pelo menos 7 dias de antecedência
                </p>
              </div>
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
}