import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { GlassCard } from "@/components/GlassCard";
import { DocumentUpload } from "@/components/DocumentUpload";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Document } from "@shared/schema";
import { FileText, Download, Share2, Trash2, Shield, AlertTriangle, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface DocumentsProps {
  onNavigate: (section: string) => void;
}

export function Documents({ onNavigate }: DocumentsProps) {
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: documents = [], isLoading } = useQuery<Document[]>({
    queryKey: ["/api/documents"],
  });

  const deleteDocumentMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/documents/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete document");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      toast({
        title: "Document deleted",
        description: "The document has been successfully deleted.",
      });
    },
    onError: () => {
      toast({
        title: "Error deleting document",
        description: "Please try again.",
        variant: "destructive",
      });
    },
  });

  const getDocumentIcon = (type: string) => {
    switch (type) {
      case "passport":
        return <FileText className="w-5 h-5 text-blue-500" />;
      case "visa":
        return <FileText className="w-5 h-5 text-green-500" />;
      case "insurance":
        return <Shield className="w-5 h-5 text-purple-500" />;
      case "booking":
        return <FileText className="w-5 h-5 text-orange-500" />;
      default:
        return <FileText className="w-5 h-5 text-gray-500" />;
    }
  };

  const getDocumentColor = (type: string) => {
    switch (type) {
      case "passport":
        return "bg-blue-500/20";
      case "visa":
        return "bg-green-500/20";
      case "insurance":
        return "bg-purple-500/20";
      case "booking":
        return "bg-orange-500/20";
      default:
        return "bg-gray-500/20";
    }
  };

  const checklist = [
    { id: "passport", label: "Passport (valid 6+ months)", completed: documents.some(d => d.type === "passport") },
    { id: "insurance", label: "Travel insurance", completed: documents.some(d => d.type === "insurance") },
    { id: "visa", label: "Visa (if required)", completed: documents.some(d => d.type === "visa") },
    { id: "license", label: "Driver's license", completed: false },
    { id: "vaccination", label: "Vaccination records", completed: false },
    { id: "reservations", label: "Hotel reservations", completed: documents.some(d => d.type === "booking") },
  ];

  const completedItems = checklist.filter(item => item.completed).length;
  const completionPercentage = Math.round((completedItems / checklist.length) * 100);

  const handleDownload = (document: Document) => {
    const link = document.createElement("a");
    link.href = document.url;
    link.download = document.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleShare = (document: Document) => {
    if (navigator.share) {
      navigator.share({
        title: document.name,
        url: document.url,
      });
    } else {
      navigator.clipboard.writeText(document.url);
      toast({
        title: "Link copied",
        description: "Document link has been copied to clipboard.",
      });
    }
  };

  const handleDelete = (document: Document) => {
    if (window.confirm("Are you sure you want to delete this document?")) {
      deleteDocumentMutation.mutate(document.id);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-8">
          <div className="h-20 bg-white/20 rounded-2xl"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="h-64 bg-white/20 rounded-2xl"></div>
              <div className="h-96 bg-white/20 rounded-2xl"></div>
            </div>
            <div className="space-y-6">
              <div className="h-64 bg-white/20 rounded-2xl"></div>
              <div className="h-96 bg-white/20 rounded-2xl"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 pb-20 md:pb-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">Travel Documents</h2>
        <p className="text-white/70">Keep all your important documents organized and accessible</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upload Area and Document List */}
        <div className="lg:col-span-2">
          <GlassCard className="p-8 mb-6">
            <h3 className="text-xl font-semibold text-[#1A202C] mb-4">Upload Documents</h3>
            <DocumentUpload onUpload={() => {}} />
          </GlassCard>
          
          {/* Document List */}
          <GlassCard className="p-6">
            <h3 className="text-xl font-semibold text-[#1A202C] mb-4">My Documents</h3>
            
            {documents.length > 0 ? (
              <div className="space-y-3">
                {documents.map((document) => (
                  <div
                    key={document.id}
                    className="flex items-center justify-between p-4 bg-white/30 rounded-xl hover:bg-white/40 transition-colors"
                  >
                    <div className="flex items-center">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center mr-4 ${getDocumentColor(document.type)}`}>
                        {getDocumentIcon(document.type)}
                      </div>
                      <div>
                        <p className="font-medium text-[#1A202C]">{document.name}</p>
                        <p className="text-[#1A202C]/60 text-sm">
                          Uploaded {new Date(document.uploadedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDownload(document)}
                      >
                        <Download className="w-4 h-4 text-[#1A202C]/60" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleShare(document)}
                      >
                        <Share2 className="w-4 h-4 text-[#1A202C]/60" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(document)}
                      >
                        <Trash2 className="w-4 h-4 text-[#1A202C]/60" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-[#1A202C]/40 mx-auto mb-4" />
                <p className="text-[#1A202C]/60">No documents uploaded yet</p>
                <p className="text-[#1A202C]/40 text-sm">Upload your first document to get started</p>
              </div>
            )}
          </GlassCard>
        </div>
        
        {/* Sidebar */}
        <div className="space-y-6">
          <GlassCard className="p-6">
            <h3 className="text-lg font-semibold text-[#1A202C] mb-4">Document Checklist</h3>
            <div className="space-y-3">
              {checklist.map((item) => (
                <label key={item.id} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={item.completed}
                    readOnly
                    className="mr-3 rounded"
                  />
                  <span className={`text-[#1A202C] ${item.completed ? 'line-through opacity-60' : ''}`}>
                    {item.label}
                  </span>
                </label>
              ))}
            </div>
            
            <div className="mt-4 pt-4 border-t border-white/20">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[#1A202C]/60 text-sm">Completion</span>
                <span className="text-[#1A202C]/60 text-sm">{completionPercentage}%</span>
              </div>
              <Progress value={completionPercentage} className="h-2" />
            </div>
          </GlassCard>
          
          <GlassCard className="p-6">
            <h3 className="text-lg font-semibold text-[#1A202C] mb-4">Smart Reminders</h3>
            <div className="space-y-3">
              <div className="p-3 bg-yellow-500/20 rounded-xl">
                <div className="flex items-center">
                  <AlertTriangle className="w-4 h-4 text-yellow-500 mr-2" />
                  <span className="text-[#1A202C]/80 text-sm">Check passport expiration date</span>
                </div>
              </div>
              <div className="p-3 bg-blue-500/20 rounded-xl">
                <div className="flex items-center">
                  <Info className="w-4 h-4 text-blue-500 mr-2" />
                  <span className="text-[#1A202C]/80 text-sm">Verify visa requirements for destination</span>
                </div>
              </div>
              <div className="p-3 bg-green-500/20 rounded-xl">
                <div className="flex items-center">
                  <Shield className="w-4 h-4 text-green-500 mr-2" />
                  <span className="text-[#1A202C]/80 text-sm">Consider travel insurance coverage</span>
                </div>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
