import { useQuery } from "@tanstack/react-query";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { MapPin, Globe, Calendar, FileText, Plus, List, Upload } from "lucide-react";
import { Trip } from "@shared/schema";

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
          Welcome back, {user?.name || "Traveler"}!
        </h2>
        <p className="text-white/70">Ready to plan your next adventure?</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <GlassCard hover className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[#1A202C]/60 text-sm">Active Trips</p>
              <p className="text-2xl font-bold text-[#1A202C]">{upcomingTrips.length}</p>
            </div>
            <div className="w-12 h-12 bg-[#667EEA]/20 rounded-xl flex items-center justify-center">
              <MapPin className="w-6 h-6 text-[#667EEA]" />
            </div>
          </div>
        </GlassCard>
        
        <GlassCard hover className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[#1A202C]/60 text-sm">Countries Visited</p>
              <p className="text-2xl font-bold text-[#1A202C]">{completedTrips.length}</p>
            </div>
            <div className="w-12 h-12 bg-[#48BB78]/20 rounded-xl flex items-center justify-center">
              <Globe className="w-6 h-6 text-[#48BB78]" />
            </div>
          </div>
        </GlassCard>
        
        <GlassCard hover className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[#1A202C]/60 text-sm">Next Trip</p>
              <p className="text-2xl font-bold text-[#1A202C]">
                {upcomingTrips.length > 0 ? "Soon" : "None"}
              </p>
            </div>
            <div className="w-12 h-12 bg-[#F093FB]/20 rounded-xl flex items-center justify-center">
              <Calendar className="w-6 h-6 text-[#F093FB]" />
            </div>
          </div>
        </GlassCard>
        
        <GlassCard hover className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[#1A202C]/60 text-sm">Documents</p>
              <p className="text-2xl font-bold text-[#1A202C]">0</p>
            </div>
            <div className="w-12 h-12 bg-[#764BA2]/20 rounded-xl flex items-center justify-center">
              <FileText className="w-6 h-6 text-[#764BA2]" />
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Upcoming Trips */}
      <div className="mb-8">
        <h3 className="text-xl font-semibold text-white mb-4">Upcoming Trips</h3>
        {upcomingTrips.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {upcomingTrips.slice(0, 3).map((trip) => (
              <GlassCard key={trip.id} hover className="overflow-hidden">
                <div className="aspect-video bg-gradient-to-br from-[#667EEA] to-[#764BA2] relative">
                  <div className="absolute inset-0 bg-black/20" />
                  <div className="absolute bottom-4 left-4 right-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-lg font-semibold text-white">{trip.name}</h4>
                      <span className="text-sm text-white/70">
                        {Math.ceil((new Date(trip.endDate).getTime() - new Date(trip.startDate).getTime()) / (1000 * 60 * 60 * 24))} days
                      </span>
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  <p className="text-[#1A202C]/60 text-sm mb-4">{trip.destination}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[#1A202C]/60">
                      {new Date(trip.startDate).toLocaleDateString()} - {new Date(trip.endDate).toLocaleDateString()}
                    </span>
                    <Button
                      size="sm"
                      onClick={() => onNavigate("my-trips")}
                      className="bg-[#667EEA] hover:bg-[#667EEA]/90"
                    >
                      Manage
                    </Button>
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        ) : (
          <GlassCard className="p-8 text-center">
            <p className="text-[#1A202C]/60 mb-4">No upcoming trips planned yet.</p>
            <Button
              onClick={() => onNavigate("create-trip")}
              className="bg-[#667EEA] hover:bg-[#667EEA]/90"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Trip
            </Button>
          </GlassCard>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <GlassCard className="p-6">
          <h3 className="text-lg font-semibold text-[#1A202C] mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <Button
              onClick={() => onNavigate("create-trip")}
              className="w-full flex items-center justify-between p-4 bg-[#667EEA]/10 hover:bg-[#667EEA]/20 text-[#1A202C] h-auto"
              variant="ghost"
            >
              <div className="flex items-center">
                <Plus className="w-5 h-5 text-[#667EEA] mr-3" />
                <span>Create New Trip</span>
              </div>
              <div className="w-5 h-5 text-[#1A202C]/60" />
            </Button>
            
            <Button
              className="w-full flex items-center justify-between p-4 bg-[#48BB78]/10 hover:bg-[#48BB78]/20 text-[#1A202C] h-auto"
              variant="ghost"
            >
              <div className="flex items-center">
                <List className="w-5 h-5 text-[#48BB78] mr-3" />
                <span>Generate Packing List</span>
              </div>
              <div className="w-5 h-5 text-[#1A202C]/60" />
            </Button>
            
            <Button
              onClick={() => onNavigate("documents")}
              className="w-full flex items-center justify-between p-4 bg-[#764BA2]/10 hover:bg-[#764BA2]/20 text-[#1A202C] h-auto"
              variant="ghost"
            >
              <div className="flex items-center">
                <Upload className="w-5 h-5 text-[#764BA2] mr-3" />
                <span>Upload Documents</span>
              </div>
              <div className="w-5 h-5 text-[#1A202C]/60" />
            </Button>
          </div>
        </GlassCard>
        
        <GlassCard className="p-6">
          <h3 className="text-lg font-semibold text-[#1A202C] mb-4">AI Travel Tips</h3>
          <div className="space-y-4">
            <div className="p-4 bg-[#F093FB]/10 rounded-xl">
              <p className="text-[#1A202C]/80 text-sm">💡 Pack light layers for varying weather conditions!</p>
            </div>
            <div className="p-4 bg-[#667EEA]/10 rounded-xl">
              <p className="text-[#1A202C]/80 text-sm">🌟 Book transportation tickets in advance to save money.</p>
            </div>
            <div className="p-4 bg-[#48BB78]/10 rounded-xl">
              <p className="text-[#1A202C]/80 text-sm">🏖️ Don't forget to check visa requirements for your destination.</p>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
