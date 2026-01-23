import { useState } from "react";

type PendingDelete = {
  orgId: string;
  action: () => void;
};

export function useDeleteOrganization() {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(null);

  function requestDelete(orgId: string, action: () => void) {
    setPendingDelete({ orgId, action });
    setShowDeleteDialog(true);
  }

  return {
    showDeleteDialog,
    setShowDeleteDialog,
    pendingDelete,
    setPendingDelete,
    requestDelete,
  };
}
