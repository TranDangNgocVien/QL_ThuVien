import axios from "axios";

// json-server dùng làm REST API thực hành, chạy bằng: npm run server
export const apiClient = axios.create({
  baseURL: "http://localhost:3001",
  headers: {
    "Content-Type": "application/json",
  },
});
