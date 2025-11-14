import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from '@/lib/queryClient';
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  Search,
  Filter,
  Map,
  MapPin,
  TreeDeciduous,
  CircleCheck,
  CircleAlert,
  Info,
  Calendar,
  Ruler,
  FilterX,
  Plus,
  Download,
  Pencil,
  Trash2,
  Grid,
  List,
  Brush,
  CopyCheck,
  CheckSquare,
  Square
} from "lucide-react";
import { useLocation } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

// Tipos para los árboles del inventario
interface TreeInventory {
  id: number;
  code: string;
  speciesId: number;
  speciesName: string;
  scientificName: string;
  parkId: number;
  parkName: string;
  latitude: string;
  longitude: string;
  plantingDate: string | null;
  healthStatus: string;
  height: number | null;
  diameter: number | null;
  lastInspectionDate: string | null;
}

// Tipo para el árbol seleccionado
interface TreeDetail extends TreeInventory {
  locationDescription?: string;
  notes?: string;
  condition?: string;
}

// Tipo para las áreas
interface ParkArea {
  id: number;
  name: string;
  description: string | null;
  parkId: number;
  parkName?: string;
  areaCode: string | null;
  polygon: any | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  treeCount?: number;
}

function TreeMapPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [parkFilter, setParkFilter] = useState("all");
  const [speciesFilter, setSpeciesFilter] = useState("all");
  const [healthFilter, setHealthFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [maintenanceFilter, setMaintenanceFilter] = useState("all");
  const [selectedTree, setSelectedTree] = useState<TreeDetail | null>(null);
  const [mapCenter, setMapCenter] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [map, setMap] = useState<any | null>(null);
  const [markers, setMarkers] = useState<any[]>([]);
  const [activeView, setActiveView] = useState("mapa");
  const [selectedParkIdForAreas, setSelectedParkIdForAreas] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedAreas, setSelectedAreas] = useState<Set<number>>(new Set());
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedArea, setSelectedArea] = useState<ParkArea | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    parkId: "",
    dimensions: "",
    latitude: "",
    longitude: "",
    responsiblePerson: "",
    isActive: true,
  });

  const { data: parks, isLoading: isLoadingParks } = useQuery({
    queryKey: ["/api/parks"],
    queryFn: async () => {
      const response = await fetch("/api/parks?simple=true");
      if (!response.ok) {
        throw new Error("Error al cargar los parques");
      }
      const result = await response.json();
      return result.data || result;
    },
  });

  // Consultar las especies para el filtro
  const { data: species, isLoading: isLoadingSpecies } = useQuery({
    queryKey: ["/api/tree-species"],
    queryFn: async () => {
      const response = await fetch("/api/tree-species");
      if (!response.ok) {
        throw new Error("Error al cargar las especies");
      }
      return response.json();
    },
  });

  // Consultar las áreas para el selector y estadísticas
  const { data: areas, isLoading: isLoadingAreas } = useQuery({
    queryKey: ['/api/trees/areas', selectedParkIdForAreas],
    queryFn: async () => {
      const url = selectedParkIdForAreas !== 'all' 
        ? `/api/trees/areas?parkId=${selectedParkIdForAreas}`
        : '/api/trees/areas';

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Error al cargar las áreas');
      }
      return response.json();
    },
  });

  // Mutación para crear área
    const createAreaMutation = useMutation({
      mutationFn: async (data: any) => {
        return apiRequest("/api/trees/areas", {
          method: "POST",
          data: data,
        });
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/trees/areas"] });
        toast({
          title: "Área creada",
          description: "El área se creó exitosamente",
        });
        setIsCreateDialogOpen(false);
        resetForm();
      },
      onError: (error: Error) => {
        toast({
          title: "Error",
          description: error.message || "No se pudo crear el área",
          variant: "destructive",
        });
      },
    });
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trees/areas"] });
      toast({
        title: "Área creada",
        description: "El área se creó exitosamente",
      });
      setIsCreateDialogOpen(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo crear el área",
        variant: "destructive",
      });
    },
  });

  // Mutación para editar área
  const editAreaMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const response = await fetch(`/api/trees/areas/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Error al editar área");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trees/areas"] });
      toast({
        title: "Área actualizada",
        description: "El área se actualizó exitosamente",
      });
      setIsEditDialogOpen(false);
      setSelectedArea(null);
      resetForm();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar el área",
        variant: "destructive",
      });
    },
  });

  // Mutación para eliminar área
  const deleteAreaMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/trees/areas/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Error al eliminar área");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trees/areas"] });
      toast({
        title: "Área eliminada",
        description: "El área se eliminó exitosamente",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar el área",
        variant: "destructive",
      });
    },
  });

  // Mutación para eliminar múltiples áreas
  const deleteBulkAreasMutation = useMutation({
    mutationFn: async (ids: number[]) => {
      const results = await Promise.all(
        ids.map(id =>
          fetch(`/api/trees/areas/${id}`, {
            method: "DELETE",
            credentials: "include",
          })
        )
      );

      const errors = results.filter(r => !r.ok);
      if (errors.length > 0) {
        throw new Error(`No se pudieron eliminar ${errors.length} área(s)`);
      }

      return results;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trees/areas"] });
      toast({
        title: "Áreas eliminadas",
        description: `Se eliminaron ${selectedAreas.size} área(s) exitosamente`,
      });
      setSelectedAreas(new Set());
      setSelectionMode(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Consultar todos los árboles
  const {
    data: treeInventory,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: [
      "/api/trees",
      parkFilter,
      speciesFilter,
      healthFilter,
      categoryFilter,
      maintenanceFilter,
    ],
    queryFn: async () => {
      let url = "/api/trees?limit=1000"; // Solicitamos un límite alto para mostrar más árboles en el mapa

      if (parkFilter !== "all") {
        url += `&parkId=${parkFilter}`;
      }

      if (speciesFilter !== "all") {
        url += `&speciesId=${speciesFilter}`;
      }

      if (healthFilter !== "all") {
        url += `&healthStatus=${healthFilter}`;
      }

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Error al cargar el inventario de árboles");
      }

      return response.json();
    },
  });

  // Inicializar el mapa cuando el componente se monte
  useEffect(() => {
    const initMap = () => {
      // Ubicación por defecto (Guadalajara, Jalisco)
      const defaultCenter = { lat: 20.6597, lng: -103.3496 };

      const mapElement = document.getElementById("tree-map");
      if (mapElement && window.google && window.google.maps) {
        const mapOptions = {
          center: mapCenter || defaultCenter,
          zoom: 13,
          mapTypeId: window.google.maps.MapTypeId.ROADMAP,
          mapTypeControl: true,
          streetViewControl: true,
          fullscreenControl: true,
        };

        const newMap = new window.google.maps.Map(mapElement, mapOptions);
        setMap(newMap);
        setMapLoaded(true);
      }
    };

    if (!mapLoaded && window.google && window.google.maps) {
      initMap();
    } else if (!window.google || !window.google.maps) {
      // Si la API de Google Maps no está cargada, utilizamos una solución alternativa
      // Marcamos como cargado para mostrar el estado alternativo
      setMapLoaded(true);
    }
  }, [mapCenter, mapLoaded]);

  // Cuando se carguen los árboles, añadimos los marcadores al mapa
  useEffect(() => {
    if (
      mapLoaded &&
      map &&
      treeInventory &&
      treeInventory.data &&
      treeInventory.data.length > 0 &&
      window.google &&
      window.google.maps
    ) {
      // Limpiar marcadores existentes
      markers.forEach((marker) => marker.setMap(null));
      const newMarkers = [];

      // Filtrar los árboles según la categoría seleccionada
      let filteredTrees = [...treeInventory.data];

      if (categoryFilter !== "all") {
        filteredTrees = filteredTrees.filter((tree: TreeInventory) => {
          // Categorizar árboles según su plantingDate (edad)
          const plantingDate = tree.plantingDate
            ? new Date(tree.plantingDate)
            : null;
          const now = new Date();
          const ageYears = plantingDate
            ? now.getFullYear() - plantingDate.getFullYear()
            : null;

          switch (categoryFilter) {
            case "joven":
              return ageYears !== null && ageYears < 5;
            case "maduro":
              return ageYears !== null && ageYears >= 5 && ageYears < 15;
            case "antiguo":
              return ageYears !== null && ageYears >= 15;
            case "riesgo":
              return (
                tree.healthStatus.toLowerCase() === "malo" ||
                tree.healthStatus.toLowerCase() === "crítico"
              );
            default:
              return true;
          }
        });
      }

      // Filtrar árboles según el criterio de mantenimiento
      if (maintenanceFilter !== "all") {
        filteredTrees = filteredTrees.filter((tree: TreeInventory) => {
          const lastInspection = tree.lastInspectionDate
            ? new Date(tree.lastInspectionDate)
            : null;
          const now = new Date();

          // Calcular la diferencia en meses
          const monthsDiff = lastInspection
            ? Math.floor(
                (now.getTime() - lastInspection.getTime()) /
                  (30.44 * 24 * 60 * 60 * 1000),
              )
            : null;

          switch (maintenanceFilter) {
            case "urgente":
              // Árboles sin inspección en más de 12 meses o en estado crítico
              return (
                monthsDiff === null ||
                monthsDiff > 12 ||
                tree.healthStatus.toLowerCase() === "crítico"
              );
            case "pendiente":
              // Árboles sin inspección entre 6 y 12 meses
              return monthsDiff !== null && monthsDiff >= 6 && monthsDiff <= 12;
            case "reciente":
              // Árboles inspeccionados en los últimos 6 meses
              return monthsDiff !== null && monthsDiff < 6;
            default:
              return true;
          }
        });
      }

      // Añadir nuevos marcadores para los árboles filtrados
      filteredTrees.forEach((tree: TreeInventory) => {
        if (tree.latitude && tree.longitude) {
          try {
            const lat = parseFloat(tree.latitude);
            const lng = parseFloat(tree.longitude);

            if (!isNaN(lat) && !isNaN(lng)) {
              // Determinar el color del marcador según el estado de salud
              let markerIcon = "";
              switch (tree.healthStatus.toLowerCase()) {
                case "bueno":
                  markerIcon =
                    "http://maps.google.com/mapfiles/ms/icons/green-dot.png";
                  break;
                case "regular":
                  markerIcon =
                    "http://maps.google.com/mapfiles/ms/icons/yellow-dot.png";
                  break;
                case "malo":
                  markerIcon =
                    "http://maps.google.com/mapfiles/ms/icons/orange-dot.png";
                  break;
                case "crítico":
                  markerIcon =
                    "http://maps.google.com/mapfiles/ms/icons/red-dot.png";
                  break;
                default:
                  markerIcon =
                    "http://maps.google.com/mapfiles/ms/icons/blue-dot.png";
              }

              const marker = new window.google.maps.Marker({
                position: { lat, lng },
                map: map,
                title: `${tree.code} - ${tree.speciesName}`,
                icon: markerIcon,
              });

              // Añadir evento de clic al marcador
              marker.addListener("click", () => {
                setSelectedTree(tree);

                // Crear una ventana de información
                const infoWindow = new window.google.maps.InfoWindow({
                  content: `
                    <div style="padding: 10px; max-width: 200px;">
                      <h3 style="margin: 0 0 5px; font-size: 16px; color: #1e5128;">${tree.code}</h3>
                      <p style="margin: 5px 0; font-size: 14px;"><b>Especie:</b> ${tree.speciesName}</p>
                      <p style="margin: 5px 0; font-size: 14px;"><b>Parque:</b> ${tree.parkName}</p>
                      <p style="margin: 5px 0; font-size: 14px;"><b>Estado:</b> ${tree.healthStatus}</p>
                      <button style="background: #1e5128; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer; margin-top: 5px;" onclick="window.location.href='/admin/trees/inventory/${tree.id}'">Ver detalles</button>
                    </div>
                  `,
                });

                infoWindow.open(map, marker);
              });

              newMarkers.push(marker);
            }
          } catch (error) {
            console.error("Error al procesar coordenadas:", error);
          }
        }
      });

      setMarkers(newMarkers);

      // Si es la primera carga y tenemos árboles, centramos el mapa en el primer árbol
      if (newMarkers.length > 0 && !mapCenter) {
        const firstTree = treeInventory.data[0];
        try {
          const lat = parseFloat(firstTree.latitude);
          const lng = parseFloat(firstTree.longitude);
          if (!isNaN(lat) && !isNaN(lng)) {
            setMapCenter({ lat, lng });
            map.setCenter({ lat, lng });
          }
        } catch (error) {
          console.error("Error al centrar mapa:", error);
        }
      }
    }
  }, [
    treeInventory,
    map,
    mapLoaded,
    mapCenter,
    markers,
    categoryFilter,
    maintenanceFilter,
  ]);

  // Usamos useEffect para evitar re-renders infinitos al mostrar el toast
  React.useEffect(() => {
    if (error) {
      toast({
        title: "Error",
        description:
          "No se pudo cargar el inventario de árboles. Por favor, intenta nuevamente.",
        variant: "destructive",
      });
    }
  }, [error, toast]);

  // Función para limpiar todos los filtros
  const clearAllFilters = () => {
    setParkFilter("all");
    setSpeciesFilter("all");
    setHealthFilter("all");
    setCategoryFilter("all");
    setMaintenanceFilter("all");
  };

  // Función para calcular estadísticas por categoría
  const getCategoryStats = () => {
    if (!treeInventory || !treeInventory.data) return {};

    let young = 0;
    let mature = 0;
    let old = 0;
    let atRisk = 0;

    treeInventory.data.forEach((tree: TreeInventory) => {
      // Categorizar árboles según su plantingDate (edad)
      const plantingDate = tree.plantingDate
        ? new Date(tree.plantingDate)
        : null;
      const now = new Date();
      const ageYears = plantingDate
        ? now.getFullYear() - plantingDate.getFullYear()
        : null;

      if (ageYears !== null && ageYears < 5) {
        young++;
      } else if (ageYears !== null && ageYears >= 5 && ageYears < 15) {
        mature++;
      } else if (ageYears !== null && ageYears >= 15) {
        old++;
      }

      if (
        tree.healthStatus.toLowerCase() === "malo" ||
        tree.healthStatus.toLowerCase() === "crítico"
      ) {
        atRisk++;
      }
    });

    return {
      young,
      mature,
      old,
      atRisk,
    };
  };

  // Función para calcular estadísticas por estado de salud
  const getHealthStats = () => {
    if (!treeInventory || !treeInventory.data) return {};

    let good = 0;
    let regular = 0;
    let bad = 0;
    let critical = 0;

    treeInventory.data.forEach((tree: TreeInventory) => {
      switch (tree.healthStatus.toLowerCase()) {
        case "bueno":
          good++;
          break;
        case "regular":
          regular++;
          break;
        case "malo":
          bad++;
          break;
        case "crítico":
          critical++;
          break;
      }
    });

    return {
      good,
      regular,
      bad,
      critical,
    };
  };

  // Función para calcular estadísticas por mantenimiento
  const getMaintenanceStats = () => {
    if (!treeInventory || !treeInventory.data) return {};

    let urgent = 0;
    let pending = 0;
    let recent = 0;

    treeInventory.data.forEach((tree: TreeInventory) => {
      const lastInspection = tree.lastInspectionDate
        ? new Date(tree.lastInspectionDate)
        : null;
      const now = new Date();

      // Calcular la diferencia en meses
      const monthsDiff = lastInspection
        ? Math.floor(
            (now.getTime() - lastInspection.getTime()) /
              (30.44 * 24 * 60 * 60 * 1000),
          )
        : null;

      if (
        monthsDiff === null ||
        monthsDiff > 12 ||
        tree.healthStatus.toLowerCase() === "crítico"
      ) {
        urgent++;
      } else if (monthsDiff !== null && monthsDiff >= 6 && monthsDiff <= 12) {
        pending++;
      } else if (monthsDiff !== null && monthsDiff < 6) {
        recent++;
      }
    });

    return {
      urgent,
      pending,
      recent,
    };
  };

  const getHealthStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "bueno":
        return (
          <Badge
            variant="outline"
            className="bg-green-50 text-green-700 hover:bg-green-100"
          >
            <CircleCheck className="h-3 w-3 mr-1" /> Bueno
          </Badge>
        );
      case "regular":
        return (
          <Badge
            variant="outline"
            className="bg-yellow-50 text-yellow-700 hover:bg-yellow-100"
          >
            <Info className="h-3 w-3 mr-1" /> Regular
          </Badge>
        );
      case "malo":
        return (
          <Badge
            variant="outline"
            className="bg-orange-50 text-orange-700 hover:bg-orange-100"
          >
            <CircleAlert className="h-3 w-3 mr-1" /> Malo
          </Badge>
        );
      case "crítico":
        return (
          <Badge variant="destructive">
            <CircleAlert className="h-3 w-3 mr-1" /> Crítico
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Obtener estadísticas
  const categoryStats = getCategoryStats();
  const healthStats = getHealthStats();
  const maintenanceStats = getMaintenanceStats();

  // Funciones para manejo de selección
  const handleClearFilters = () => {
    setSelectedParkIdForAreas("all");
    setSearchQuery("");
  };

  const handleSelectAllAreas = () => {
    if (areas) {
      const allIds = new Set(areas.map(area => area.id));
      setSelectedAreas(allIds);
    }
  };

  const handleDeselectAllAreas = () => {
    setSelectedAreas(new Set());
    setSelectionMode(false);
  };

  const handleBulkDeleteClick = () => {
    if (selectedAreas.size > 0) {
      if (confirm(`¿Estás seguro de eliminar ${selectedAreas.size} área(s)?`)) {
        deleteBulkAreasMutation.mutate(Array.from(selectedAreas));
      }
    }
  };

  // Filtrar áreas por búsqueda
  const filteredAreas = areas?.filter(area => {
    const matchesSearch = searchQuery === "" || 
      area.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      area.areaCode?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  }) || [];

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      parkId: "",
      areaCode: "",
      dimensions: "",
      latitude: "",
      longitude: "",
      responsiblePerson: "",
      isActive: true,
    });
  };

  const handleCreate = () => {
    resetForm();
    setIsCreateDialogOpen(true);
  };

  const handleEdit = (area: ParkArea) => {
    setSelectedArea(area);
    setFormData({
      name: area.name,
      description: area.description || "",
      parkId: area.parkId.toString(),
      areaCode: area.areaCode || "",
      dimensions: "", // Agregar cuando esté en la BD
      latitude: "", // Agregar cuando esté en la BD
      longitude: "", // Agregar cuando esté en la BD
      responsiblePerson: "", // Agregar cuando esté en la BD
      isActive: area.isActive,
    });
    setIsEditDialogOpen(true);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">

        <PageHeader
          icon={MapPin}
          title="Gestión de Áreas"
          subtitle="Administra las áreas y zonas de los parques"
          actions={[
            <Button 
              variant="primary" 
              onClick={handleCreate}
              data-testid="button-new-area"
            >
              <Plus className="w-4 h-4 md:mr-2 stroke-[4]" />
              <span className="hidden md:inline">Nuevo</span>
            </Button>,
            <Button 
              variant="tertiary" 
              onClick={() => console.log("Exportar áreas")}
              data-testid="button-export-areas"
            >
              <Download className="h-4 w-4 md:mr-2" />
              <span className="hidden md:inline">Exportar</span>
            </Button>,
          ]}
        />

        {/* Cards de estadísticas */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
          <Card className="bg-[#ceefea] border-none">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[#00444f]">Total de Áreas</p>
                  <p className="text-3xl font-bold text-[#00444f] mt-2">
                    {areas?.length || 0}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-[#00a587] flex items-center justify-center">
                  <MapPin className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#ceefea] border-none">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[#00444f]">Árboles Asignados</p>
                  <p className="text-3xl font-bold text-[#00444f] mt-2">
                    {areas?.reduce((sum, area) => sum + (area.treeCount || 0), 0) || 0}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-[#00a587] flex items-center justify-center">
                  <TreeDeciduous className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#ceefea] border-none">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[#00444f]">Áreas Activas</p>
                  <p className="text-3xl font-bold text-[#00444f] mt-2">
                    {areas?.filter(area => area.isActive).length || 0}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-[#00a587] flex items-center justify-center">
                  <CircleCheck className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#ceefea] border-none">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[#00444f]">Área Mayor</p>
                  <p className="text-lg font-bold text-[#00444f] mt-2">
                    {areas && areas.length > 0 
                      ? areas.reduce((max, area) => 
                          (area.treeCount || 0) > (max.treeCount || 0) ? area : max
                        ).name
                      : 'N/A'
                    }
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-[#00a587] flex items-center justify-center">
                  <Map className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Barra de filtros */}
        <div className="bg-white p-4 rounded-lg border border-gray-200 mb-6">
          <div className="flex items-start justify-start gap-3">
            {/* Buscador */}
            <div className="relative flex-1 min-w-[280px] max-w-lg">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-600" />
              <Input
                placeholder="Buscar áreas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-full"
                data-testid="input-search-areas"
              />
            </div>

            {/* Filtro por parque */}
            <div className="min-w-[160px]">
              <Select value={selectedParkIdForAreas} onValueChange={setSelectedParkIdForAreas}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Todos los parques" />
                </SelectTrigger>
                <SelectContent position="popper" sideOffset={4} className="pointer-events-auto z-[999]">
                  <SelectItem value="all">Todos los parques</SelectItem>
                  {!isLoadingParks && parks && parks.map((park: any) => (
                    <SelectItem key={park.id} value={park.id.toString()}>
                      {park.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Botón limpiar filtros */}
            <div>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-10 h-10 bg-gray-100" 
                onClick={handleClearFilters}
              >
                <Brush className="h-4 w-4 text-[#4b5b65]" />
              </Button>
            </div>

            {/* Toggle de vista */}
            <div className="ml-auto">
              <div className="flex border rounded-lg p-1 bg-gray-100">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className={`${viewMode === 'grid' ? 'bg-primary text-white' : 'text-foreground'}`}
                  data-testid="button-view-grid"
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className={`${viewMode === 'list' ? 'bg-primary text-white' : 'text-foreground'}`}
                  data-testid="button-view-list"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Botón de selección múltiple con menú desplegable */}
            <div className="relative group">
              <Button
                variant={selectionMode ? 'default' : 'outline'}
                size="sm"
                className={`flex items-center h-11 w-11 ${selectionMode ? 'bg-primary text-white' : 'bg-gray-100'}`}
                data-testid="button-selection-toggle"
              >
                <CopyCheck className="h-5 w-5" />
              </Button>

              {/* Dropdown menu */}
              <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-md shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <div className="py-1">
                  <button
                    onClick={() => setSelectionMode(true)}
                    className="w-full text-left block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 flex items-center"
                    data-testid="menu-enable-selection"
                  >
                    <CopyCheck className="h-4 w-4 mr-2" />
                    Selección múltiple
                  </button>
                  <button
                    onClick={() => {
                      if (!selectionMode) setSelectionMode(true);
                      handleSelectAllAreas();
                    }}
                    className="w-full text-left block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 flex items-center"
                    data-testid="menu-select-all"
                  >
                    <CheckSquare className="h-5 w-5 mr-2" />
                    Seleccionar todo
                  </button>
                  <button
                    onClick={handleDeselectAllAreas}
                    className="w-full text-left block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 flex items-center"
                    data-testid="menu-deselect-all"
                  >
                    <Square className="h-4 w-4 mr-2" />
                    Deseleccionar
                  </button>
                </div>
              </div>
            </div>

            {/* Botón para eliminar elementos */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleBulkDeleteClick}
              className="flex items-center h-11 w-11 bg-[#ededed] text-destructive hover:bg-destructive/10 hover:text-destructive"
              disabled={selectedAreas.size === 0}
              data-testid="button-delete-selected"
            >
              <Trash2 className="h-5 w-5" />
              {selectedAreas.size > 0 ? ` (${selectedAreas.size})` : ''}
            </Button>
          </div>
        </div>

        {/* Grid/Lista de áreas */}
        {isLoadingAreas ? (
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
            {[1, 2, 3].map((i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="h-48 w-full" />
                <CardContent className="p-4">
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : !filteredAreas || filteredAreas.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <MapPin className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                {searchQuery || selectedParkIdForAreas !== 'all' 
                  ? 'No se encontraron áreas con los filtros aplicados'
                  : 'No hay áreas registradas'}
              </h3>
              <p className="text-gray-500 mb-4">
                {searchQuery || selectedParkIdForAreas !== 'all'
                  ? 'Intenta con otros criterios de búsqueda'
                  : 'Comienza creando tu primera área'}
              </p>
              {!searchQuery && selectedParkIdForAreas === 'all' && (
                <Button 
                  onClick={handleCreate}
                  className="bg-[#00a587] hover:bg-[#00a587]/90"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Nueva Área
                </Button>
              )}
            </CardContent>
          </Card>
        ) : viewMode === 'grid' ? (
          // Vista de Grid
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAreas.map((area) => (
              <Card 
                key={area.id} 
                className={`overflow-hidden hover:shadow-lg transition-all cursor-pointer group relative ${
                  selectionMode ? 'ring-2 ring-transparent hover:ring-[#00a587]' : ''
                } ${selectedAreas.has(area.id) ? 'ring-2 ring-[#00a587]' : ''}`}
                onClick={() => {
                  if (selectionMode) {
                    const newSelected = new Set(selectedAreas);
                    if (newSelected.has(area.id)) {
                      newSelected.delete(area.id);
                    } else {
                      newSelected.add(area.id);
                    }
                    setSelectedAreas(newSelected);
                  } else {
                    console.log("Ver área", area.id);
                  }
                }}
              >
                {/* Checkbox de selección */}
                {selectionMode && (
                  <div className="absolute top-2 left-2 z-10">
                    <div className={`h-6 w-6 rounded border-2 flex items-center justify-center ${
                      selectedAreas.has(area.id) 
                        ? 'bg-[#00a587] border-[#00a587]' 
                        : 'bg-white border-gray-300'
                    }`}>
                      {selectedAreas.has(area.id) && (
                        <CheckSquare className="h-4 w-4 text-white" />
                      )}
                    </div>
                  </div>
                )}

                {/* Imagen placeholder */}
                <div className="h-48 bg-gradient-to-br from-[#ceefea] to-[#00a587] relative">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <MapPin className="h-16 w-16 text-white/50" />
                  </div>
                  {!area.isActive && (
                    <div className="absolute top-2 right-2">
                      <Badge variant="secondary">Inactiva</Badge>
                    </div>
                  )}
                </div>

                <CardContent className="p-4">
                  {/* Título y código */}
                  <div className="mb-3">
                    <h3 className="font-semibold text-lg text-gray-900 group-hover:text-[#00a587] transition-colors">
                      {area.name}
                    </h3>
                    {area.areaCode && (
                      <p className="text-sm text-gray-500">Código: {area.areaCode}</p>
                    )}
                  </div>

                  {/* Información */}
                  <div className="space-y-2 mb-4">
                    {area.parkName && (
                      <div className="flex items-center text-sm text-gray-600">
                        <MapPin className="h-4 w-4 mr-2 text-[#00a587]" />
                        <span>{area.parkName}</span>
                      </div>
                    )}
                    <div className="flex items-center text-sm text-gray-600">
                      <TreeDeciduous className="h-4 w-4 mr-2 text-[#00a587]" />
                      <span>{area.treeCount || 0} árboles</span>
                    </div>
                  </div>

                  {/* Descripción */}
                  {area.description && (
                    <p className="text-sm text-gray-500 line-clamp-2 mb-4">
                      {area.description}
                    </p>
                  )}

                  {/* Botones de acción */}
                  {!selectionMode && (
                    <div className="flex gap-2 pt-3 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(area);
                        }}
                        className="flex-1"
                      >
                        <Pencil className="h-4 w-4 mr-1" />
                        Editar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`¿Estás seguro de eliminar el área "${area.name}"?`)) {
                            deleteAreaMutation.mutate(area.id);
                          }
                        }}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (

          // Vista de Lista
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      {selectionMode && (
                        <th className="px-4 py-3 text-left w-12">
                          <input
                            type="checkbox"
                            checked={filteredAreas.length > 0 && filteredAreas.every(area => selectedAreas.has(area.id))}
                            onChange={(e) => {
                              if (e.target.checked) {
                                handleSelectAllAreas();
                              } else {
                                handleDeselectAllAreas();
                              }
                            }}
                            className="h-4 w-4 rounded border-gray-300"
                          />
                        </th>
                      )}
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Nombre
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Parque
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Código
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Árboles
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Estado
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredAreas.map((area) => (
                      <tr 
                        key={area.id} 
                        className={`hover:bg-gray-50 cursor-pointer ${
                          selectedAreas.has(area.id) ? 'bg-[#ceefea]' : ''
                        }`}
                        onClick={() => {
                          if (selectionMode) {
                            const newSelected = new Set(selectedAreas);
                            if (newSelected.has(area.id)) {
                              newSelected.delete(area.id);
                            } else {
                              newSelected.add(area.id);
                            }
                            setSelectedAreas(newSelected);
                          } else {
                            console.log("Ver área", area.id);
                          }
                        }}
                      >
                        {selectionMode && (
                          <td className="px-4 py-4 whitespace-nowrap">
                            <input
                              type="checkbox"
                              checked={selectedAreas.has(area.id)}
                              onChange={() => {}}
                              className="h-4 w-4 rounded border-gray-300"
                            />
                          </td>
                        )}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-gray-900">{area.name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-600">{area.parkName || '-'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-600">{area.areaCode || '-'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center text-sm text-gray-600">
                            <TreeDeciduous className="h-4 w-4 text-[#00a587] mr-1" />
                            {area.treeCount || 0}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge variant={area.isActive ? "default" : "secondary"}>
                            {area.isActive ? "Activa" : "Inactiva"}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {!selectionMode && (
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEdit(area);
                                }}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (confirm(`¿Estás seguro de eliminar el área "${area.name}"?`)) {
                                    deleteAreaMutation.mutate(area.id);
                                  }
                                }}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

      </div>
      {/* Modal Crear Área */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nueva Área</DialogTitle>
            <DialogDescription>
              Crea una nueva área o zona dentro de un parque
            </DialogDescription>
          </DialogHeader>
            <form onSubmit={(e) => {
              e.preventDefault();
              createAreaMutation.mutate({
                ...formData,
                parkId: parseInt(formData.parkId),
              });
            }}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Nombre del Área *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ej: Zona Norte, Jardín Principal"
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="parkId">Parque *</Label>
                <Select
                  value={formData.parkId}
                  onValueChange={(value) => setFormData({ ...formData, parkId: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un parque" />
                  </SelectTrigger>
                  <SelectContent>
                    {parks && parks.map((park: any) => (
                      <SelectItem key={park.id} value={park.id.toString()}>
                        {park.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Preview del código */}
              {formData.name && formData.parkId && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-sm font-medium text-green-800 mb-1">
                    Código del área:
                  </p>
                  <p className="text-2xl font-bold text-green-900">
                    {(() => {
                      const park = parks?.find((p: any) => p.id.toString() === formData.parkId);
                      if (!park?.code_prefix) return "Esperando código del parque...";

                      const cleanName = formData.name
                        .replace(/^(zona|área|sector|sección)\s+/gi, '')
                        .trim()
                        .toUpperCase();

                      if (cleanName.length < 2) return `${park.code_prefix}-??`;

                      const words = cleanName.split(/\s+/);
                      const areaLetters = words.length >= 2 
                        ? words[0][0] + words[1][0]
                        : cleanName.substring(0, 2);

                      return `${park.code_prefix}-${areaLetters}`;
                    })()}
                  </p>
                  <p className="text-xs text-gray-600 mt-2">
                    Este código se generará automáticamente al guardar
                  </p>
                </div>
              )}

              <div className="grid gap-2">
                <Label htmlFor="dimensions">Dimensiones (hectáreas)</Label>
                <Input
                  id="dimensions"
                  type="number"
                  step="0.01"
                  value={formData.dimensions}
                  onChange={(e) => setFormData({ ...formData, dimensions: e.target.value })}
                  placeholder="Ej: 2.5"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="latitude">Latitud</Label>
                  <Input
                    id="latitude"
                    value={formData.latitude}
                    onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                    placeholder="Ej: 20.6597"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="longitude">Longitud</Label>
                  <Input
                    id="longitude"
                    value={formData.longitude}
                    onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                    placeholder="Ej: -103.3496"
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="responsiblePerson">Responsable</Label>
                <Input
                  id="responsiblePerson"
                  value={formData.responsiblePerson}
                  onChange={(e) => setFormData({ ...formData, responsiblePerson: e.target.value })}
                  placeholder="Nombre del responsable del área"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe el área..."
                  rows={3}
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="isActive" className="font-normal">
                  Área activa
                </Label>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                className="bg-[#00a587] hover:bg-[#00a587]/90"
                disabled={createAreaMutation.isPending}
              >
                {createAreaMutation.isPending ? "Creando..." : "Crear Área"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal Editar Área */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Área</DialogTitle>
            <DialogDescription>
              Actualiza la información del área
            </DialogDescription>
          </DialogHeader>
            <form onSubmit={(e) => {
              e.preventDefault();
              if (selectedArea) {
                editAreaMutation.mutate({
                  id: selectedArea.id,
                  data: {
                    ...formData,
                    parkId: parseInt(formData.parkId),
                  },
                });
              }
            }}>
            <div className="grid gap-4 py-4">
              {/* Mismos campos que crear */}
              <div className="grid gap-2">
                <Label htmlFor="edit-name">Nombre del Área *</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ej: Zona Norte, Jardín Principal"
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="edit-parkId">Parque *</Label>
                <Select
                  value={formData.parkId}
                  onValueChange={(value) => setFormData({ ...formData, parkId: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un parque" />
                  </SelectTrigger>
                  <SelectContent>
                    {parks && parks.map((park: any) => (
                      <SelectItem key={park.id} value={park.id.toString()}>
                        {park.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="edit-dimensions">Dimensiones (hectáreas)</Label>
                <Input
                  id="edit-dimensions"
                  type="number"
                  step="0.01"
                  value={formData.dimensions}
                  onChange={(e) => setFormData({ ...formData, dimensions: e.target.value })}
                  placeholder="Ej: 2.5"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-latitude">Latitud</Label>
                  <Input
                    id="edit-latitude"
                    value={formData.latitude}
                    onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                    placeholder="Ej: 20.6597"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-longitude">Longitud</Label>
                  <Input
                    id="edit-longitude"
                    value={formData.longitude}
                    onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                    placeholder="Ej: -103.3496"
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="edit-responsiblePerson">Responsable</Label>
                <Input
                  id="edit-responsiblePerson"
                  value={formData.responsiblePerson}
                  onChange={(e) => setFormData({ ...formData, responsiblePerson: e.target.value })}
                  placeholder="Nombre del responsable del área"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="edit-description">Descripción</Label>
                <Textarea
                  id="edit-description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe el área..."
                  rows={3}
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="edit-isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="edit-isActive" className="font-normal">
                  Área activa
                </Label>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                className="bg-[#00a587] hover:bg-[#00a587]/90"
                disabled={editAreaMutation.isPending}
              >
                {editAreaMutation.isPending ? "Guardando..." : "Guardar Cambios"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

    </AdminLayout>
  );
}

export default TreeMapPage;
