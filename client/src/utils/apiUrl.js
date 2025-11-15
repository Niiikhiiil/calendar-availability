export const apiUrls = {
  loginUser: "/auth/login",
  signupUser: "/auth/register",
  logoutUser: "/auth/logout",
  getCurrentUser: "/users/me",
  updateUser: "/users/me",
  createAvailability: "/availability",
  getAllUsers: "/users",
  updateAvailability: (id) => `/availability/${id}`,
  deleteAvailability: (id) => `/availability/${id}`,
  getCurrentUserAvailability: (startTime, endTime) =>
    `/availability?start=${startTime}&end=${endTime}`,
  getOtherUserAvailability: (userId, startTime, endTime) =>
    `/availability?userId=${userId}&start=${startTime}&end=${endTime}`,
};
