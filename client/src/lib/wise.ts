// Integração com Wise API para rastreamento de gastos
const WISE_API_BASE = "https://api.wise.com";
const WISE_API_KEY = import.meta.env.VITE_WISE_API_KEY;

export interface WiseProfile {
  id: number;
  type: string;
  name: string;
  email: string;
}

export interface WiseBalance {
  id: number;
  currency: string;
  amount: {
    value: number;
    currency: string;
  };
  name: string;
  type: string;
}

export interface WiseTransaction {
  id: number;
  type: string;
  state: string;
  amount: {
    value: number;
    currency: string;
  };
  description: string;
  date: string;
  merchant?: {
    name: string;
    category: string;
    location?: string;
  };
}

export interface WiseExchangeRate {
  source: string;
  target: string;
  rate: number;
  timestamp: string;
}

class WiseAPI {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    if (!this.apiKey) {
      throw new Error("API key da Wise não configurada");
    }

    const url = `${WISE_API_BASE}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        "Authorization": `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`Erro na API Wise: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async getProfiles(): Promise<WiseProfile[]> {
    return this.request("/v1/profiles");
  }

  async getBalances(profileId: number): Promise<WiseBalance[]> {
    return this.request(`/v1/profiles/${profileId}/balances`);
  }

  async getTransactions(
    profileId: number,
    currency: string,
    intervalStart: string,
    intervalEnd: string
  ): Promise<WiseTransaction[]> {
    const params = new URLSearchParams({
      currency,
      intervalStart,
      intervalEnd,
    });
    
    return this.request(`/v1/profiles/${profileId}/transactions?${params}`);
  }

  async getExchangeRates(source: string, target: string): Promise<WiseExchangeRate> {
    const params = new URLSearchParams({
      source,
      target,
    });
    
    return this.request(`/v1/rates?${params}`);
  }

  async convertCurrency(amount: number, from: string, to: string): Promise<number> {
    const rate = await this.getExchangeRates(from, to);
    return amount * rate.rate;
  }
}

export const wiseApi = new WiseAPI(WISE_API_KEY || "");

// Funções auxiliares para gastos de viagem
export async function getTravelExpenses(
  profileId: number,
  startDate: string,
  endDate: string,
  currency: string = "BRL"
): Promise<WiseTransaction[]> {
  try {
    const transactions = await wiseApi.getTransactions(
      profileId,
      currency,
      startDate,
      endDate
    );

    // Filtrar apenas transações de gastos (débitos)
    return transactions.filter(t => t.amount.value < 0);
  } catch (error) {
    console.error("Erro ao buscar gastos de viagem:", error);
    return [];
  }
}

export async function categorizeExpenses(transactions: WiseTransaction[]): Promise<{
  accommodation: WiseTransaction[];
  food: WiseTransaction[];
  transportation: WiseTransaction[];
  entertainment: WiseTransaction[];
  shopping: WiseTransaction[];
  others: WiseTransaction[];
}> {
  const categories = {
    accommodation: [] as WiseTransaction[],
    food: [] as WiseTransaction[],
    transportation: [] as WiseTransaction[],
    entertainment: [] as WiseTransaction[],
    shopping: [] as WiseTransaction[],
    others: [] as WiseTransaction[],
  };

  transactions.forEach(transaction => {
    const description = transaction.description.toLowerCase();
    const merchantCategory = transaction.merchant?.category?.toLowerCase();

    if (description.includes("hotel") || description.includes("hostel") || description.includes("airbnb") || 
        merchantCategory?.includes("accommodation")) {
      categories.accommodation.push(transaction);
    } else if (description.includes("restaurant") || description.includes("food") || description.includes("café") ||
               merchantCategory?.includes("restaurant") || merchantCategory?.includes("food")) {
      categories.food.push(transaction);
    } else if (description.includes("uber") || description.includes("taxi") || description.includes("transport") ||
               description.includes("metro") || description.includes("bus") || description.includes("train") ||
               merchantCategory?.includes("transport")) {
      categories.transportation.push(transaction);
    } else if (description.includes("museum") || description.includes("tour") || description.includes("ticket") ||
               merchantCategory?.includes("entertainment") || merchantCategory?.includes("recreation")) {
      categories.entertainment.push(transaction);
    } else if (description.includes("shop") || description.includes("store") || description.includes("mall") ||
               merchantCategory?.includes("retail") || merchantCategory?.includes("shopping")) {
      categories.shopping.push(transaction);
    } else {
      categories.others.push(transaction);
    }
  });

  return categories;
}

export async function calculateTotalExpenses(
  transactions: WiseTransaction[],
  targetCurrency: string = "BRL"
): Promise<number> {
  let total = 0;

  for (const transaction of transactions) {
    const amount = Math.abs(transaction.amount.value);
    
    if (transaction.amount.currency === targetCurrency) {
      total += amount;
    } else {
      try {
        const convertedAmount = await wiseApi.convertCurrency(
          amount,
          transaction.amount.currency,
          targetCurrency
        );
        total += convertedAmount;
      } catch (error) {
        console.error(`Erro ao converter ${transaction.amount.currency} para ${targetCurrency}:`, error);
        // Usar valor original se conversão falhar
        total += amount;
      }
    }
  }

  return total;
}

export function formatCurrency(amount: number, currency: string = "BRL"): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: currency,
  }).format(amount);
}

export function isWiseConfigured(): boolean {
  return !!WISE_API_KEY;
}