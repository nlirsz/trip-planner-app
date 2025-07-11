import { useState } from "react";
import { useLocation } from "wouter";
import { Plane, Home, Plus, Briefcase, FileText, Bell, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavigationProps {
  onSectionChange: (section: string) => void;
  currentSection: string;
}

export function Navigation({ onSectionChange, currentSection }: NavigationProps) {
  const [location] = useLocation();

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: Home },
    { id: "create-trip", label: "New Trip", icon: Plus },
    { id: "my-trips", label: "My Trips", icon: Briefcase },
    { id: "documents", label: "Documents", icon: FileText },
  ];

  return (
    <>
      {/* Desktop Navigation */}
      <header className="backdrop-blur-lg bg-white/10 sticky top-0 z-50 border-b border-white/20">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                <Plane className="w-4 h-4 text-white" />
              </div>
              <h1 className="text-xl font-bold text-white">TravelAI</h1>
            </div>
            
            {/* Desktop Navigation Tabs */}
            <nav className="hidden md:flex space-x-1 bg-white/10 rounded-lg p-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => onSectionChange(item.id)}
                    className={cn(
                      "px-4 py-2 rounded-md transition-all duration-200 flex items-center space-x-2",
                      currentSection === item.id
                        ? "text-white bg-white/20"
                        : "text-white/70 hover:text-white hover:bg-white/20"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
            
            <div className="flex items-center space-x-4">
              <button className="relative p-2 text-white/70 hover:text-white transition-colors">
                <Bell className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-[#F093FB] rounded-full"></span>
              </button>
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-white/70" />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Navigation */}
      <nav className="md:hidden backdrop-blur-lg bg-white/10 fixed bottom-0 left-0 right-0 z-40 border-t border-white/20">
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
                    : "text-white/70 hover:text-white"
                )}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}
