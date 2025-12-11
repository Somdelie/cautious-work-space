import { getManagers } from "@/actions/manager";
import { ManagersTable } from "@/components/managers/managers-table";

async function ManagersPage() {
  const managers = await getManagers();
  const managersData = managers.data || [];
  return (
    <div className="max-h-[90vh] overflow-y-auto px-4 py-4 w-full">
      {/* <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-5">
        <h1 className="text-3xl font-bold text-white tracking-tight">
          Managers
        </h1>
        <CreateManagerDialog />
      </div> */}
      <ManagersTable managers={managersData} />
    </div>
  );
}

export default ManagersPage;
