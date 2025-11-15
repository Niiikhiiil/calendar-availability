import { email, z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  department: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const updateUserSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .optional()
    .nullable(),

  department: z
    .string()
    .min(2, "Department must be at least 2 characters")
    .optional()
    .nullable(),
});

export const availabilitySchema = z.object({
  start: z.string(), // ISO
  end: z.string(),
  status: z.enum(["AVAILABLE", "BUSY", "TENTATIVE"]),
  recurringRule: z.string().optional(),
  description: z.string(),
});

export const responseMessage = {
  noUsersFound: "No users found!",
  userNotFound: "User not found!",
  invalidCredentials: "Invalid credentials!",
  emailAlreadyExists: "Email already exists!",
  userLogoutSuccess: "Logged out successfully.",
  userLoggedInSuccess: "Logged in successfully.",
  usersFetchSuccess: "Users fetched successfully.",
  noFieldProvided: "No fields provided to update!",
  userUpdatedSuccess: "User updated successfully.",
  availabilityNotFound: "Availability event not found!",
  userRegisteredSuccess: "User registered successfully.",
  userFetchSuccess: "Current user fetched successfully.",
  serverErrorLoggingInUser: "Server error while logging in!",
  serverErrorUpdatingUser: "Server error while updating user!",
  serverErrorLoggingOutUser: "Server error while logging out!",
  serverErrorFetchingUsers: "Server error while fetching users!",
  availabilityFetchedSuccess: "Availability fetched successfully.",
  availabilityCreatedSuccess: "Availability created successfully.",
  availabilityUpdatedSuccess: "Availability updated successfully.",
  availabilityDeletedSuccess: "Availability deleted successfully.",
  serverErrorRegisteringUser: "Server error while registering user!",
  serverErrorFetchingUser: "Server error while fetching current user!",
  startTimeandEndTimeRequired: "Start time and end time are required!",
  serverErrorUpdatingAvailability: "Server error while updating the event!",
  availabilityNotAuthorized:
    "Not authorized to modify this availability event!",
  serverErrorCreatingAvailability:
    "Server error while creating availability event!",
  serverErrorFetchingAvailability:
    "Server error while fetching availability events!",
  serverErrorDeletingAvailability:
    "Server error while deleting the availability event!",
};
