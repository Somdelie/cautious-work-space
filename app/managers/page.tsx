import { getManagers } from "@/actions/manager";
import { ManagersTable } from "@/components/managers/managers-table";

async function ManagersPage() {
  const managers = await getManagers();
  const managersData = managers.data || [];
  return (
    <div className="max-w-7xl mx-auto w-full max-h-[calc(100vh-60px)] overflow-hidden">
      <ManagersTable managers={managersData} />
    </div>
  );
}

export default ManagersPage;
