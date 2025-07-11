import { useState } from "react";
import { useLocation } from "wouter";
import { Plane, Home, Plus, Briefcase, FileText, Bell, User, MapPin, Calendar, DollarSign, CheckSquare, CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavigationProps {
  onSectionChange: (section: string) => void;
  currentSection: string;
}

export function Navigation({ onSectionChange, currentSection }: NavigationProps) {
  const [location] = useLocation();

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: Home },
    { id: "my-trips", label: "Viagens", icon: Briefcase },
    { id: "flight-details", label: "Voos", icon: Plane },
    { id: "accommodations", label: "Hospedagens", icon: MapPin },
    { id: "itinerary", label: "Cronograma", icon: Calendar },
    { id: "packing", label: "Mala", icon: CheckSquare },
    { id: "expenses", label: "Gastos", icon: DollarSign },
    { id: "travel-docs", label: "Documentos", icon: FileText },
  ];

  return (
    <>
      {/* Desktop Navigation */}
      <header className="backdrop-blur-lg bg-white/20 sticky top-0 z-50 border-b border-white/30">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-white/30 rounded-lg flex items-center justify-center">
                <img src="/attached_assets/logo miller_1752271542982.png" alt="Miller" className="w-5 h-5" />
              </div>
              <h1 className="text-xl font-bold text-white">Miller</h1>
            </div>
            
            {/* Desktop Navigation Tabs */}
            <nav className="hidden md:flex space-x-1 bg-white/15 rounded-lg p-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => onSectionChange(item.id)}
                    className={cn(
                      "px-4 py-2 rounded-md transition-all duration-200 flex items-center space-x-2 font-medium",
                      currentSection === item.id
                        ? "text-white bg-white/30 shadow-lg"
                        : "text-white/80 hover:text-white hover:bg-white/20"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
            
            <div className="flex items-center space-x-4">
              <button className="relative p-2 text-white/80 hover:text-white transition-colors">
                <Bell className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-[#F093FB] rounded-full"></span>
              </button>
              <div className="w-8 h-8 bg-white/30 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Navigation */}
      <nav className="md:hidden backdrop-blur-lg bg-white/20 fixed bottom-0 left-0 right-0 z-40 border-t border-white/30">
        <div className="flex justify-around py-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => onSectionChange(item.id)}
                className={cn(
                  "flex flex-col items-center space-y-1 transition-colors",
                  currentSection === item.id
                    ? "text-white"
                    : "text-white/80 hover:text-white"
                )}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}
