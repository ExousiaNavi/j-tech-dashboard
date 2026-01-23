import { useEffect, useState } from "react";
import { API_URL } from "../config";

export type OrgsMap = Record<string, string[]>;
type DeleteOrgResponse = {
  org_id: string;
  status: string;
  last_org: string | null;
};

export function useOrganizations() {
  const [orgs, setOrgs] = useState<OrgsMap>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ---------------- Fetch ----------------
  const refreshOrgs = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/org`);
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setOrgs(data);
    } catch (err: any) {
      setError(err.message || "Failed to load organizations");
    } finally {
      setLoading(false);
    }
  };

  // ---------------- Create ----------------
  const createOrg = async (orgName: string) => {
    const res = await fetch(`${API_URL}/org/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ org_id: orgName }),
    });

    if (!res.ok) throw new Error(await res.text());
    await refreshOrgs();
  };

  // ---------------- Delete ----------------
  const deleteOrg = async (orgName: string): Promise<DeleteOrgResponse> => {
    const res = await fetch(`${API_URL}/org/${encodeURIComponent(orgName)}`, {
      method: "DELETE",
    });

    if (!res.ok) throw new Error(await res.text());

    const data: DeleteOrgResponse = await res.json();

    await refreshOrgs(); // keep UI in sync

    return data; // ✅ IMPORTANT
  };

  // ---------------- Init load ----------------
  useEffect(() => {
    refreshOrgs();
  }, []);

  return {
    orgs,
    loading,
    error,
    refreshOrgs,
    createOrg,
    deleteOrg,
  };
}
