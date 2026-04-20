"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";

interface Props {
  propertyId: string | null;
  onClose: () => void;
}

export function DeletePropertyDialog({ propertyId, onClose }: Props) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleDelete = async () => {
    if (!propertyId) return;
    setLoading(true);
    const { error } = await supabase.from("properties").delete().eq("id", propertyId);
    if (error) {
      toast({ title: "Error al eliminar", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Propiedad eliminada" });
      router.refresh();
      onClose();
    }
    setLoading(false);
  };

  return (
    <Dialog open={!!propertyId} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Eliminar propiedad</DialogTitle>
          <DialogDescription>
            ¿Estás seguro de que querés eliminar esta propiedad? Esta acción no se puede deshacer.
            No se puede eliminar si tiene contratos asociados.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button variant="destructive" onClick={handleDelete} disabled={loading}>
            {loading ? "Eliminando..." : "Eliminar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
