import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader } from "@/components/ui/loader";

interface DeleteDialogProps {
  title: string;
  itemName: string;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting: boolean;
}

export function DeleteDialog({
  title,
  itemName,
  isOpen,
  onClose,
  onConfirm,
  isDeleting
}: DeleteDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <p className="text-sm text-gray-500">
            Are you sure you want to delete this {itemName}? This action cannot be undone.
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isDeleting}>Cancel</Button>
          <Button variant="destructive" onClick={onConfirm} disabled={isDeleting}>
            {isDeleting ? <Loader className="w-4 h-4 mr-2 text-current" /> : null}
            {title}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
