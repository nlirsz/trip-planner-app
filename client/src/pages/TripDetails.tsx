import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Trip } from "@shared/schema";
import { X, Download, Share2, Calendar, MapPin, Clock, CheckCircle } from "lucide-react";
import { format } from "date-fns";

interface TripDetailsProps {
  trip: Trip | null;
  onClose: () => void;
}

export function TripDetails({ trip, onClose }: TripDetailsProps) {
  const [activeTab, setActiveTab] = useState<"itinerary" | "packing">("itinerary");

  if (!trip) return null;

  const startDate = new Date(trip.startDate);
  const endDate = new Date(trip.endDate);
  const duration = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

  const mockItinerary = [
    {
      day: 1,
      date: format(startDate, "MMM d"),
      city: trip.destination,
      activities: [
        { time: "Morning", activity: "Arrive at airport", location: "Airport", notes: "Check transportation options" },
        { time: "Afternoon", activity: "Check into hotel", location: "Hotel", notes: "Rest and freshen up" },
        { time: "Evening", activity: "Explore local area", location: "City center", notes: "Find dinner spot" },
      ]
    },
    {
      day: 2,
      date: format(new Date(startDate.getTime() + 24 * 60 * 60 * 1000), "MMM d"),
      city: trip.destination,
      activities: [
        { time: "Morning", activity: "Visit main attractions", location: "Tourist sites", notes: "Book tickets in advance" },
        { time: "Afternoon", activity: "Local cuisine lunch", location: "Restaurant", notes: "Try signature dishes" },
        { time: "Evening", activity: "Cultural experience", location: "Local venue", notes: "Research events" },
      ]
    }
  ];

  const mockPackingList = {
    clothing: ["Light jacket", "Comfortable walking shoes", "Casual shirts", "Jeans"],
    electronics: ["Phone charger", "Camera", "Power adapter", "Headphones"],
    documents: ["Passport", "Travel insurance", "Hotel reservations", "Flight tickets"],
    health: ["Sunscreen", "Basic first aid", "Prescription medications", "Hand sanitizer"]
  };

  const handleExportCalendar = async () => {
    try {
      const response = await fetch(`/api/trips/${trip.id}/calendar`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${trip.name}.ics`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export calendar:', error);
    }
  };

  const handleShareTrip = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: trip.name,
          text: `Check out my trip to ${trip.destination}!`,
          url: window.location.href,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      // Fallback to clipboard
      navigator.clipboard.writeText(window.location.href);
      alert('Trip link copied to clipboard!');
    }
  };

  return (
    <Dialog open={!!trip} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto backdrop-blur-lg bg-white/90 border border-white/30">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-bold text-[#1A202C]">{trip.name}</DialogTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex items-center space-x-4 text-[#1A202C]/60">
            <div className="flex items-center">
              <MapPin className="w-4 h-4 mr-1" />
              <span>{trip.destination}</span>
            </div>
            <div className="flex items-center">
              <Calendar className="w-4 h-4 mr-1" />
              <span>{format(startDate, "MMM d")} - {format(endDate, "MMM d, yyyy")}</span>
            </div>
            <div className="flex items-center">
              <Clock className="w-4 h-4 mr-1" />
              <span>{duration} days</span>
            </div>
          </div>
        </DialogHeader>
        
        <div className="mt-6">
          {/* Tab Navigation */}
          <div className="flex space-x-1 mb-6 bg-white/30 rounded-lg p-1">
            <button
              onClick={() => setActiveTab("itinerary")}
              className={`flex-1 py-2 px-4 rounded-md transition-colors ${
                activeTab === "itinerary"
                  ? "bg-[#667EEA] text-white"
                  : "text-[#1A202C]/70 hover:text-[#1A202C]"
              }`}
            >
              Daily Itinerary
            </button>
            <button
              onClick={() => setActiveTab("packing")}
              className={`flex-1 py-2 px-4 rounded-md transition-colors ${
                activeTab === "packing"
                  ? "bg-[#667EEA] text-white"
                  : "text-[#1A202C]/70 hover:text-[#1A202C]"
              }`}
            >
              Packing List
            </button>
          </div>

          {/* Content */}
          <div className="grid grid-cols-1 gap-6">
            {activeTab === "itinerary" ? (
              <div className="space-y-4">
                {mockItinerary.map((day) => (
                  <div key={day.day} className="p-4 bg-white/30 rounded-xl">
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-medium text-[#1A202C]">Day {day.day} - {day.city}</span>
                      <span className="text-[#1A202C]/60 text-sm">{day.date}</span>
                    </div>
                    <div className="space-y-2">
                      {day.activities.map((activity, idx) => (
                        <div key={idx} className="flex items-start space-x-3">
                          <div className="w-2 h-2 bg-[#667EEA] rounded-full mt-2"></div>
                          <div>
                            <p className="font-medium text-[#1A202C]">{activity.time}: {activity.activity}</p>
                            <p className="text-[#1A202C]/70 text-sm">{activity.location}</p>
                            {activity.notes && (
                              <p className="text-[#1A202C]/60 text-sm italic">{activity.notes}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {Object.entries(mockPackingList).map(([category, items]) => (
                  <div key={category} className="p-4 bg-white/30 rounded-xl">
                    <h5 className="font-medium text-[#1A202C] mb-3 capitalize">
                      {category === "health" ? "Health & Personal" : category}
                    </h5>
                    <div className="space-y-2">
                      {items.map((item, idx) => (
                        <label key={idx} className="flex items-center">
                          <input
                            type="checkbox"
                            className="mr-3 rounded"
                            defaultChecked={Math.random() > 0.5}
                          />
                          <span className="text-[#1A202C]/70 text-sm">{item}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="mt-8 flex justify-end space-x-4">
            <Button
              variant="outline"
              onClick={handleExportCalendar}
              className="border-white/30 bg-white/30 hover:bg-white/40"
            >
              <Download className="w-4 h-4 mr-2" />
              Export to Calendar
            </Button>
            <Button
              onClick={handleShareTrip}
              className="bg-[#667EEA] hover:bg-[#667EEA]/90"
            >
              <Share2 className="w-4 h-4 mr-2" />
              Share Trip
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
