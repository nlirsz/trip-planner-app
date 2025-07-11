import { useState } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Navigation } from "@/components/Navigation";
import { Dashboard } from "@/pages/Dashboard";
import { CreateTrip } from "@/pages/CreateTrip";
import { MyTrips } from "@/pages/MyTrips";
import { Documents } from "@/pages/Documents";
import { TripDetails } from "@/pages/TripDetails";
import { Trip } from "@shared/schema";

function App() {
  const [currentSection, setCurrentSection] = useState("dashboard");
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);

  const handleSectionChange = (section: string) => {
    setCurrentSection(section);
    setSelectedTrip(null);
  };

  const handleTripSelect = (trip: Trip) => {
    setSelectedTrip(trip);
  };

  const handleTripDetailsClose = () => {
    setSelectedTrip(null);
  };

  const renderCurrentSection = () => {
    switch (currentSection) {
      case "dashboard":
        return <Dashboard onNavigate={handleSectionChange} />;
      case "create-trip":
        return <CreateTrip onNavigate={handleSectionChange} />;
      case "my-trips":
        return <MyTrips onNavigate={handleSectionChange} onTripSelect={handleTripSelect} />;
      case "documents":
        return <Documents onNavigate={handleSectionChange} />;
      default:
        return <Dashboard onNavigate={handleSectionChange} />;
    }
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen bg-gradient-to-br from-[#667EEA] to-[#764BA2]">
          <Navigation 
            onSectionChange={handleSectionChange} 
            currentSection={currentSection}
          />
          <main className="fade-in">
            {renderCurrentSection()}
          </main>
          <TripDetails 
            trip={selectedTrip} 
            onClose={handleTripDetailsClose}
          />
        </div>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
