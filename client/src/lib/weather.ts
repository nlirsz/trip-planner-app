export interface WeatherData {
  temperature: number;
  conditions: string;
  humidity: number;
  windSpeed: number;
}

export async function getWeatherForecast(destination: string): Promise<WeatherData> {
  // This would integrate with OpenWeatherMap API
  // For now, return mock data
  return {
    temperature: 22,
    conditions: "Partly cloudy",
    humidity: 65,
    windSpeed: 12
  };
}
