import { Trip } from "@shared/schema";
import { GlassCard } from "./GlassCard";
import { Calendar, Clock, MapPin, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

interface TripCardProps {
  trip: Trip;
  onViewDetails: (trip: Trip) => void;
  onEdit: (trip: Trip) => void;
  onEliteAssistant?: (tripId: number) => void;
}

export function TripCard({ trip, onViewDetails, onEdit, onEliteAssistant }: TripCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "upcoming":
        return "bg-[#667EEA]/20 text-[#667EEA]";
      case "in-progress":
        return "bg-[#F093FB]/20 text-[#F093FB]";
      case "completed":
        return "bg-[#48BB78]/20 text-[#48BB78]";
      default:
        return "bg-[#F093FB]/20 text-[#F093FB]";
    }
  };

  const startDate = new Date(trip.startDate);
  const endDate = new Date(trip.endDate);
  const duration = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

  return (
    <GlassCard hover className="overflow-hidden">
      <div className="aspect-video bg-gradient-to-br from-[#667EEA] to-[#764BA2] relative">
        <div className="absolute inset-0 bg-black/20" />
        <div className="absolute bottom-4 left-4 right-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-white">{trip.name}</h3>
            <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(trip.status || "planning")}`}>
              {trip.status || "Planning"}
            </span>
          </div>
        </div>
      </div>
      
      <div className="p-6">
        <div className="flex items-center text-white/90 mb-4">
          <MapPin className="w-4 h-4 mr-2" />
          <span className="text-sm">{trip.destination}</span>
        </div>
        
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center text-white/90 text-sm">
            <Calendar className="w-4 h-4 mr-2" />
            <span>{format(startDate, "MMM d")} - {format(endDate, "MMM d, yyyy")}</span>
          </div>
          <div className="flex items-center text-white/90 text-sm">
            <Clock className="w-4 h-4 mr-2" />
            <span>{duration} days</span>
          </div>
        </div>
        
        {trip.status !== "completed" && (
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-white/90 text-sm">Planning Progress</span>
              <span className="text-white/90 text-sm">75%</span>
            </div>
            <div className="w-full bg-white/30 rounded-full h-2">
              <div className="bg-[#667EEA] h-2 rounded-full" style={{ width: "75%" }} />
            </div>
          </div>
        )}
        
        <div className="space-y-3">
          {onEliteAssistant && (
            <Button 
              onClick={() => onEliteAssistant(trip.id)}
              className="w-full bg-gradient-to-r from-[#667EEA] to-[#764BA2] hover:from-[#667EEA]/90 hover:to-[#764BA2]/90 text-white font-medium"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Assistente Elite
            </Button>
          )}
          <div className="grid grid-cols-2 gap-3">
            <Button 
              onClick={() => onViewDetails(trip)}
              className="bg-[#667EEA] hover:bg-[#667EEA]/90 text-white"
            >
              View Details
            </Button>
            <Button 
              onClick={() => onEdit(trip)}
              variant="outline"
              className="border-white/30 bg-white/30 hover:bg-white/40"
            >
              Edit Trip
            </Button>
          </div>
        </div>
      </div>
    </GlassCard>
  );
}
