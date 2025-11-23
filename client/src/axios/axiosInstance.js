import axios from "axios";

export const base = "http://localhost:4000";
// export const base = "https://calendar-availability-backend.onrender.com";

const baseUrl = "http://localhost:4000/api";
// const baseUrl = "https://calendar-availability-backend.onrender.com/api";

const axiosInstance = axios.create({
  baseURL: baseUrl,
  withCredentials: true,
});

export default axiosInstance;
