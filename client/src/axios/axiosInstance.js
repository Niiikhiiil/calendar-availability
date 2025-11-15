import axios from "axios";
export const prod_base = "";

export const base = "http://localhost:4000";

// const baseUrl =
//   "https://multiuser-calendar-availability-backend.onrender.com/api";
const baseUrl = "http://localhost:4000/api";

const axiosInstance = axios.create({
  baseURL: baseUrl,
  withCredentials: true,
});

export default axiosInstance;
