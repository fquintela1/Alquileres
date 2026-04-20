"use client";
import { useState } from "react";
import { Property } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getPropertyTypeLabel, cn } from "@/lib/utils";
import { Building2, MapPin, Pencil, Trash2, Search, Eye } from "lucide-react";
import Link from "next/link";
import { DeletePropertyDialog } from "./delete-property-dialog";

interface Props {
  properties: Property[];
}

const typeColors: Record<string, string> = {
  casa: "bg-green-50 text-green-700",
  departamento: "bg-blue-50 text-blue-700",
  cochera: "bg-purple-50 text-purple-700",
  local: "bg-orange-50 text-orange-700",
  otro: "bg-slate-50 text-slate-700",
};

export function PropertiesList({ properties }: Props) {
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filtered = properties.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.address.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar propiedad..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Building2 className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p className="font-medium">No se encontraron propiedades</p>
          {properties.length === 0 && (
            <p className="text-sm mt-1">
              <Link href="/propiedades/nueva" className="text-primary hover:underline">
                Agregá tu primera propiedad
              </Link>
            </p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((property) => (
            <Card key={property.id} className="border-0 shadow-sm bg-white hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center">
                      <Building2 className="w-4 h-4 text-slate-600" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">{property.name}</h3>
                      <span className={cn("text-xs font-medium px-1.5 py-0.5 rounded", typeColors[property.type] ?? typeColors.otro)}>
                        {getPropertyTypeLabel(property.type)}
                      </span>
                    </div>
                  </div>
                  <Badge variant={property.status === "alquilado" ? "success" : "secondary"} className="shrink-0">
                    {property.status === "alquilado" ? "Alquilado" : "Disponible"}
                  </Badge>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-4">
                  <MapPin className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{property.address}</span>
                </div>

                {property.observations && (
                  <p className="text-xs text-muted-foreground bg-slate-50 rounded px-2.5 py-1.5 mb-3 line-clamp-2">
                    {property.observations}
                  </p>
                )}

                <div className="flex items-center gap-2 pt-2 border-t">
                  <Button variant="ghost" size="sm" asChild className="flex-1">
                    <Link href={`/propiedades/${property.id}`}>
                      <Eye className="w-3.5 h-3.5" />
                      Ver
                    </Link>
                  </Button>
                  <Button variant="ghost" size="sm" asChild className="flex-1">
                    <Link href={`/propiedades/${property.id}/editar`}>
                      <Pencil className="w-3.5 h-3.5" />
                      Editar
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => setDeleteId(property.id)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <DeletePropertyDialog
        propertyId={deleteId}
        onClose={() => setDeleteId(null)}
      />
    </div>
  );
}
