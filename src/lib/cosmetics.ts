import axios from "axios";

export const cosmeticsClient = axios.create({
  baseURL: "https://fortnite-api.com/v2",
  timeout: 15000,
});

export async function getCosmetic(id: string) {
  const response = await cosmeticsClient.get(`/cosmetics/br/${id}`);
  return response.data;
}
