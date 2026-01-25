import React from "react";
import { ViewJobDialog } from "../dialogs/view-job";
import { EditJobDialog } from "../dialogs/edit-job";
import { DeleteJobDialog } from "../dialogs/delete-job";

interface MainDialogsProps {
  selectedJobId: string | null;
  viewDialogOpen: boolean;
  setViewDialogOpen: (open: boolean) => void;
  editDialogOpen: boolean;
  setEditDialogOpen: (open: boolean) => void;
  deleteDialogOpen: boolean;
  setDeleteDialogOpen: (open: boolean) => void;
  jobToDelete: { id: string; jobNumber: string; siteName: string } | null;
  setJobToDelete: (
    job: { id: string; jobNumber: string; siteName: string } | null,
  ) => void;
}

const MainDialogs = ({
  selectedJobId,
  viewDialogOpen,
  setViewDialogOpen,
  editDialogOpen,
  setEditDialogOpen,
  deleteDialogOpen,
  setDeleteDialogOpen,
  jobToDelete,
  setJobToDelete,
}: MainDialogsProps) => {
  return (
    <div>
      {/* dialogs */}
      <ViewJobDialog
        jobId={selectedJobId}
        open={viewDialogOpen}
        onOpenChange={setViewDialogOpen}
      />

      <EditJobDialog
        jobId={selectedJobId}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSuccess={() => window.location.reload()}
      />

      <DeleteJobDialog
        jobId={jobToDelete?.id ?? null}
        jobNumber={jobToDelete?.jobNumber}
        siteName={jobToDelete?.siteName}
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          setDeleteDialogOpen(open);
          if (!open) setJobToDelete(null);
        }}
        onSuccess={() => window.location.reload()}
      />
    </div>
  );
};

export default MainDialogs;
