import axios, { AxiosError, AxiosRequestConfig } from "axios";
import { Config } from "../../util/config";

const baseURL = Config.BACKEND_URL;

export type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

export const http = axios.create({
  baseURL,
  timeout: 8000,
});

export async function request<T>(
  config: AxiosRequestConfig,
): Promise<ApiResponse<T>> {
  try {
    const response = await http.request<T>(config);
    return { success: true, data: response.data };
  } catch (error) {
    const err = error as AxiosError;
    const data =
      typeof err.response?.data === "string"
        ? err.response.data
        : err.message || "Unknown error";

    return {
      success: false,
      error: data,
    };
  }
}
