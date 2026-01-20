// context/OrgContext.tsx
import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { API_URL } from "../config";

export interface Org {
  id: string;
  name: string;
  agents?: string[];
}

interface OrgContextValue {
  orgs: Org[];
  addOrg: (name: string) => Promise<Org | null>;
  refreshOrgs: () => Promise<void>;
}

const OrgContext = createContext<OrgContextValue | undefined>(undefined);

export const OrgProvider = ({ children }: { children: ReactNode }) => {
  const [orgs, setOrgs] = useState<Org[]>([]);

  const refreshOrgs = async () => {
    try {
      const res = await fetch(`${API_URL}/org`);
      const data: Record<string, string[]> = await res.json(); // { "Lab 1": ["PC1", "PC2"] }

      // Convert object keys into Org[]
      const orgArray: Org[] = Object.keys(data).map((orgName) => ({
        id: orgName,
        name: orgName,
        agents: data[orgName] || [],
      }));

      setOrgs(orgArray);
    } catch (err) {
      console.error("Failed to fetch orgs:", err);
    }
  };

  const addOrg = async (name: string) => {
    try {
      const res = await fetch(`${API_URL}/org/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ org_id: name }),
      });

      if (!res.ok) {
        console.error("Failed to create org, status:", res.status);
        return null;
      }

      const data: Org = await res.json();

      setOrgs((prev) => [...prev, data]);
      return data;
    } catch (err) {
      console.error("Failed to create org:", err);
      return null;
    }
  };

  useEffect(() => {
    refreshOrgs();
  }, []);

  return (
    <OrgContext.Provider value={{ orgs, addOrg, refreshOrgs }}>
      {children}
    </OrgContext.Provider>
  );
};

export const useOrg = () => {
  const context = useContext(OrgContext);
  if (!context) throw new Error("useOrg must be used within OrgProvider");
  return context;
};
