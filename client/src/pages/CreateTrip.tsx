import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { insertTripSchema } from "@shared/schema";
import { generateTripWithAI } from "@/lib/gemini";
import { Sparkles, Mountain, Camera, Utensils, Waves, CheckCircle, Cog } from "lucide-react";
import { z } from "zod";

const createTripSchema = insertTripSchema.extend({
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
});

type CreateTripFormData = z.infer<typeof createTripSchema>;

interface CreateTripProps {
  onNavigate: (section: string) => void;
}

export function CreateTrip({ onNavigate }: CreateTripProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<CreateTripFormData>({
    resolver: zodResolver(createTripSchema),
  });

  const createTripMutation = useMutation({
    mutationFn: async (data: CreateTripFormData) => {
      const response = await fetch("/api/trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          startDate: new Date(data.startDate),
          endDate: new Date(data.endDate),
          travelStyle: selectedStyles,
        }),
      });
      if (!response.ok) throw new Error("Failed to create trip");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trips"] });
      toast({
        title: "Trip created successfully!",
        description: "Your trip has been saved and is ready for planning.",
      });
      onNavigate("my-trips");
    },
    onError: () => {
      toast({
        title: "Error creating trip",
        description: "Please try again.",
        variant: "destructive",
      });
    },
  });

  const travelStyles = [
    { id: "adventure", label: "Adventure", icon: Mountain },
    { id: "photography", label: "Photography", icon: Camera },
    { id: "food", label: "Food & Wine", icon: Utensils },
    { id: "relaxation", label: "Relaxation", icon: Waves },
  ];

  const toggleStyle = (styleId: string) => {
    setSelectedStyles(prev =>
      prev.includes(styleId)
        ? prev.filter(s => s !== styleId)
        : [...prev, styleId]
    );
  };

  const onSubmit = async (data: CreateTripFormData) => {
    setIsGenerating(true);
    
    try {
      // Generate AI itinerary
      const aiData = await generateTripWithAI({
        destination: data.destination,
        startDate: data.startDate,
        endDate: data.endDate,
        budget: data.budget,
        travelStyle: selectedStyles,
        preferences: data.preferences,
      });

      // Create trip with AI-generated data
      await createTripMutation.mutateAsync({
        ...data,
        travelStyle: selectedStyles,
      });

      // Update the created trip with AI data
      // This would be handled by updating the trip after creation
    } catch (error) {
      console.error("AI generation failed:", error);
      // Still create the trip without AI data
      await createTripMutation.mutateAsync({
        ...data,
        travelStyle: selectedStyles,
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 pb-20 md:pb-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">Create New Trip</h2>
        <p className="text-white/70">Let AI help you plan the perfect adventure</p>
      </div>

      <div className="max-w-4xl mx-auto">
        <GlassCard className="p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-[#1A202C] font-medium">Trip Name</Label>
                <Input
                  id="name"
                  placeholder="My Amazing Adventure"
                  {...register("name")}
                  className="bg-white/50 border-white/30 focus:ring-[#667EEA] focus:border-[#667EEA]"
                />
                {errors.name && (
                  <p className="text-red-500 text-sm">{errors.name.message}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="destination" className="text-[#1A202C] font-medium">Destination</Label>
                <Input
                  id="destination"
                  placeholder="e.g., Barcelona, Spain"
                  {...register("destination")}
                  className="bg-white/50 border-white/30 focus:ring-[#667EEA] focus:border-[#667EEA]"
                />
                {errors.destination && (
                  <p className="text-red-500 text-sm">{errors.destination.message}</p>
                )}
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="startDate" className="text-[#1A202C] font-medium">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  {...register("startDate")}
                  className="bg-white/50 border-white/30 focus:ring-[#667EEA] focus:border-[#667EEA]"
                />
                {errors.startDate && (
                  <p className="text-red-500 text-sm">{errors.startDate.message}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="endDate" className="text-[#1A202C] font-medium">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  {...register("endDate")}
                  className="bg-white/50 border-white/30 focus:ring-[#667EEA] focus:border-[#667EEA]"
                />
                {errors.endDate && (
                  <p className="text-red-500 text-sm">{errors.endDate.message}</p>
                )}
              </div>
            </div>

            {/* Travel Style */}
            <div className="space-y-2">
              <Label className="text-[#1A202C] font-medium">Travel Style</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {travelStyles.map((style) => {
                  const Icon = style.icon;
                  return (
                    <Button
                      key={style.id}
                      type="button"
                      variant="outline"
                      onClick={() => toggleStyle(style.id)}
                      className={`p-3 h-auto flex flex-col items-center border-white/30 transition-all ${
                        selectedStyles.includes(style.id)
                          ? "bg-[#667EEA]/20 border-[#667EEA] text-[#667EEA]"
                          : "bg-white/30 hover:bg-[#667EEA]/20"
                      }`}
                    >
                      <Icon className="w-6 h-6 mb-2" />
                      <span className="text-sm">{style.label}</span>
                    </Button>
                  );
                })}
              </div>
            </div>

            {/* Budget */}
            <div className="space-y-2">
              <Label htmlFor="budget" className="text-[#1A202C] font-medium">Budget Range</Label>
              <Select onValueChange={(value) => setValue("budget", value)}>
                <SelectTrigger className="bg-white/50 border-white/30 focus:ring-[#667EEA] focus:border-[#667EEA]">
                  <SelectValue placeholder="Select budget range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="500-1000">$500 - $1,000</SelectItem>
                  <SelectItem value="1000-2500">$1,000 - $2,500</SelectItem>
                  <SelectItem value="2500-5000">$2,500 - $5,000</SelectItem>
                  <SelectItem value="5000+">$5,000+</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Additional Preferences */}
            <div className="space-y-2">
              <Label htmlFor="preferences" className="text-[#1A202C] font-medium">Additional Preferences</Label>
              <Textarea
                id="preferences"
                rows={4}
                placeholder="Tell us about your interests, dietary restrictions, accessibility needs, or any special requests..."
                {...register("preferences")}
                className="bg-white/50 border-white/30 focus:ring-[#667EEA] focus:border-[#667EEA] resize-none"
              />
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                className="border-white/30 bg-white/30 hover:bg-white/40"
              >
                Save Draft
              </Button>
              <Button
                type="submit"
                disabled={isGenerating}
                className="bg-[#667EEA] hover:bg-[#667EEA]/90 text-white flex items-center"
              >
                {isGenerating ? (
                  <>
                    <Cog className="w-4 h-4 mr-2 animate-spin" />
                    Generating with AI...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate Trip with AI
                  </>
                )}
              </Button>
            </div>
          </form>
        </GlassCard>

        {/* AI Generation Preview */}
        {isGenerating && (
          <GlassCard className="mt-8 p-8">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-[#667EEA]/20 rounded-full mb-4">
                <Sparkles className="w-8 h-8 text-[#667EEA]" />
              </div>
              <h3 className="text-xl font-semibold text-[#1A202C] mb-2">AI is Creating Your Perfect Trip</h3>
              <p className="text-[#1A202C]/60">Analyzing your preferences and generating personalized recommendations...</p>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center p-4 bg-white/30 rounded-xl">
                <div className="w-8 h-8 bg-[#48BB78]/20 rounded-full flex items-center justify-center mr-4">
                  <CheckCircle className="w-5 h-5 text-[#48BB78]" />
                </div>
                <span className="text-[#1A202C]">Analyzing destination and weather</span>
              </div>
              <div className="flex items-center p-4 bg-white/30 rounded-xl">
                <div className="w-8 h-8 bg-[#667EEA]/20 rounded-full flex items-center justify-center mr-4">
                  <Cog className="w-5 h-5 text-[#667EEA] animate-spin" />
                </div>
                <span className="text-[#1A202C]">Generating custom itinerary</span>
              </div>
              <div className="flex items-center p-4 bg-white/30 rounded-xl opacity-50">
                <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center mr-4">
                  <Cog className="w-5 h-5 text-gray-500" />
                </div>
                <span className="text-[#1A202C]">Creating packing list</span>
              </div>
            </div>
          </GlassCard>
        )}
      </div>
    </div>
  );
}
