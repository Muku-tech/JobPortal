import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5001/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor
api.interceptors.request.use(
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

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Skip redirect on public routes
      const publicPaths = ["/", "/jobs", "/jobs/", "/login", "/register"];
      const isPublic = publicPaths.some((path) =>
        window.location.pathname.startsWith(path),
      );
      if (!isPublic) {
        localStorage.removeItem("token");
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  },
);

// Resume API functions
export const resumeApi = {
  getResumes: () => api.get("/resumes"),
  getResume: (id) => api.get(`/resumes/${id}`),
  createResume: (data) => api.post("/resumes", data),
  updateResume: (id, data) => api.put(`/resumes/${id}`, data),
  deleteResume: (id) => api.delete(`/resumes/${id}`),
  setDefaultResume: (id) => api.patch(`/resumes/${id}/default`),
};

export default api;
