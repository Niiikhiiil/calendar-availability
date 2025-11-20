export const apiUrls = {
  loginUser: "/auth/login",
  signupUser: "/auth/register",
  logoutUser: "/auth/logout",
  getCurrentUser: "/users/me",
  updateUser: "/users/me",
  createAvailability: "/availability",
  getAllUsers: "/users",
  updateOneAvailability: (id) => `/availability/instance/${id}`,
  updateAllAvailability: (id) => `/availability/instance/${id}/all`,
  deleteOneAvailability: (id) => `/availability/instance/${id}`,
  deleteAllAvailability: (id) => `/availability/instance/${id}/all`,
  getCurrentUserAvailability: (startTime, endTime) =>
    `/availability?start=${startTime}&end=${endTime}`,
  getOtherUserAvailability: (userId, startTime, endTime) =>
    `/availability?userId=${userId}&start=${startTime}&end=${endTime}`,
};
