import axios from "axios";

// Cấu hình Axios Client kết nối trực tiếp đến Spring Boot API
export const apiClient = axios.create({
  baseURL: "http://localhost:8080/api", // Cập nhật đúng đường dẫn base URL của BE
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

//Response Interceptor: Bắt lỗi 401 (Hết hạn token / Chưa đăng nhập) để chuyển hướng về Login
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
     
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("library_auth_user");
  
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  },
);
