import { useUserStore } from "../stores/user";

// Conta autorizada a ver a aba secreta "Zynix Room".
const OWNER_ACCOUNT_ID = "dabfe5fa98e7493d99e91c6d8b376470";

export function useOwnerMode(): boolean {
  const accountId = useUserStore((s) => s.accountId);
  return accountId === OWNER_ACCOUNT_ID;
}
