import { useEffect, useState } from "react";
import { api } from "../lib/api";

export function useServerStatus() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    async function load() {
      const res = await api.getGameServersStatus();
      if (res.success && res.data) setData(res.data);
    }
    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, []);

  return data;
}
