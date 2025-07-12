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
import { FlightDetails } from "@/pages/FlightDetails";
import { Accommodations } from "@/pages/Accommodations";
import { Itinerary } from "@/pages/Itinerary";
import { Packing } from "@/pages/Packing";
import { Expenses } from "@/pages/Expenses";
import { TravelDocs } from "@/pages/TravelDocs";
import { Trip } from "@shared/schema";
import { Maps } from "./pages/Maps";

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
      case "my-trips":
        return <MyTrips onNavigate={handleSectionChange} onTripSelect={handleTripSelect} />;
      case "flight-details":
        return <FlightDetails onNavigate={handleSectionChange} />;
      case "accommodations":
        return <Accommodations onNavigate={handleSectionChange} />;
      case "itinerary":
        return <Itinerary onNavigate={handleSectionChange} />;
      case "packing":
        return <Packing onNavigate={handleSectionChange} />;
      case "expenses":
        return <Expenses onNavigate={handleSectionChange} />;
      case "travel-docs":
        return <TravelDocs onNavigate={handleSectionChange} />;
      case "maps":
        return <Maps onNavigate={handleSectionChange} />;
      case "create-trip":
        return <CreateTrip onNavigate={handleSectionChange} />;
      case "documents":
        return <Documents onNavigate={handleSectionChange} />;
      default:
        return <Dashboard onNavigate={handleSectionChange} />;
    }
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen bg-gradient-to-br from-[#1a1a1a] via-[#2d2d2d] to-[#1a1a1a]">
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
