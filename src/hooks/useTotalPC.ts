import { useEffect, useState } from "react";
import { API_URL } from "../config";
export function useTotalPC(pollInterval = 3000) {
  const [totalPC, setTotalPC] = useState<number>(0);

  const fetchTotalPC = async () => {
    try {
      const res = await fetch(`${API_URL}/agents`);
      if (!res.ok) return;
      const data = await res.json();
      setTotalPC(data.count || 0);
    } catch (err) {
      console.error("Failed to fetch totalPC:", err);
    }
  };

  useEffect(() => {
    fetchTotalPC(); // initial fetch
    const interval = setInterval(fetchTotalPC, pollInterval);
    return () => clearInterval(interval);
  }, []);

  return totalPC;
}
