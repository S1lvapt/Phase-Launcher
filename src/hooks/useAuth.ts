import { useUserStore } from "../stores/user";

export const useAuth = {
  user() {
    const { accountId, displayName, email, password, hydrated, accessToken } =
      useUserStore();

    return {
      accountId,
      displayName,
      email,
      hydrated,
      accessToken,
      password,

      isValidSession() {
        return Boolean(accountId && displayName);
      },

      isLoggedIn() {
        return Boolean(accountId);
      },
    };
  },

  actions() {
    const { login, logout, setProfile, clearProfile } = useUserStore();

    return {
      login,
      logout,
      setProfile,
      clearProfile,
    };
  },
};
