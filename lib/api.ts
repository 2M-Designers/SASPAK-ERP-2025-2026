const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://88.198.143.93:8082/api/";

export interface UserProfile {
  userProfileID: string;
  name: string;
  email: string;
  phone: string;
  mobile: string;
  position: string;
  department: string;
  company: string;
  location: string;
  language: string;
  lastLogin: string;
  memberSince: string;
  timezone: string;
  dateFormat: string;
  avatarURL: string;
  accountStatus: string;
  notificationSettings: {
    userProfileID: string; // Add userID to notification settings
    emailNotifications: boolean;
    pushNotifications: boolean;
    smsNotifications: boolean;
  };
}

export interface UpdateProfileData {
  userProfileID: string; // Add userID to the update data
  name?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  position?: string;
  department?: string;
  company?: string;
  location?: string;
  language?: string;
  timezone?: string;
  dateFormat?: string;
  avatarURL?: string;
}

export interface NotificationSettings {
  userProfileID: string; // Add userID to notification settings
  emailNotifications: boolean;
  pushNotifications: boolean;
  smsNotifications: boolean;
}

export interface ChangePasswordData {
  userProfileID: string; // Add userID to password data
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

// lib/fallbackApi.js
export const getFallbackDashboardMetrics = () => {
  return {
    totalInspections: 127,
    pendingInspections: 15,
    approvedInspections: 98,
    rejectedInspections: 14,
    openFindings: 23,
    complianceRate: 87,
    upcomingInspections: 8,
    overdueInspections: 3,
    regulatoryViolations: 2,
    pendingQAQCApprovals: 5,
    operatorResponseDelays: 7,
    totalEquipment: 156,
    equipmentWithFindings: 18,
    defectiveEquipmentTrends: -12,
  };
};

export const api = {
  // Get user profile
  getDashboardMetrics: async () => {
    // If we're building statically, return fallback data
    if (typeof window === "undefined") {
      return [getFallbackDashboardMetrics()];
    }

    // Otherwise, make the actual API call
    try {
      const response = await fetch(
        "http://88.198.143.93:8082/api/Dashboard/GetDashboardMetrics"
      );
      return await response.json();
    } catch (error) {
      console.error("API Error:", error);
      // Return fallback data on error
      return [getFallbackDashboardMetrics()];
    }
  },

  // Get user profile
  async getUserProfile(userId: string): Promise<UserProfile> {
    const response = await fetch(`${API_BASE_URL}UserProfile/${userId}`);
    if (!response.ok) {
      throw new Error("Failed to fetch user profile");
    }
    const data = await response.json();
    return data;
  },

  // Update user profile
  async updateUserProfile(
    userId: string,
    data: Omit<UpdateProfileData, "userProfileID">
  ): Promise<{ message: string }> {
    const requestData = {
      ...data,
      UserProfileID: userId,
    };

    const response = await fetch(
      `${API_BASE_URL}UserProfile/update/${userId}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      }
    );

    const responseText = await response.text();
    console.log("Raw response:", responseText);

    if (!response.ok) {
      // Try to parse error as JSON
      try {
        const errorJson = JSON.parse(responseText);
        throw new Error(errorJson.message || errorJson);
      } catch {
        throw new Error(responseText || "Failed to update profile");
      }
    }

    // Handle different response types
    try {
      const result = JSON.parse(responseText);

      // Handle both object response and simple number response
      if (typeof result === "number") {
        return {
          message: result > 0 ? "Update successful" : "No changes made",
        };
      }

      if (result.message) {
        return result;
      }

      return { message: "Update successful" };
    } catch {
      // If response is not JSON but is successful
      if (responseText && !isNaN(Number(responseText))) {
        const rowsAffected = parseInt(responseText);
        return {
          message: rowsAffected > 0 ? "Update successful" : "No changes made",
        };
      }

      return { message: responseText || "Update successful" };
    }
  },

  // Update notification settings
  /*async updateNotificationSettings(
    userId: string,
    settings: Omit<NotificationSettings, "userID"> // Exclude userID from parameter
  ): Promise<{ message: string }> {
    const requestData: NotificationSettings = {
      ...settings,
      userProfileID: userId, // Include userID in the request body
    };

    const response = await fetch(
      `${API_BASE_URL}UserProfile/notifications/${userId}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || "Failed to update notification settings");
    }

    return response.json();
  },*/

  // Update notification settings
  async updateNotificationSettings(
    userId: string,
    settings: Omit<NotificationSettings, "userProfileID"> // Exclude userProfileID from parameter
  ): Promise<{ message: string }> {
    const requestData = {
      ...settings,
      UserProfileID: userId, // Match backend expected field name
    };

    const response = await fetch(
      `${API_BASE_URL}UserProfile/notifications/${userId}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      }
    );

    const responseText = await response.text();
    console.log("Notification settings raw response:", responseText);

    if (!response.ok) {
      // Try to parse error as JSON
      try {
        const errorJson = JSON.parse(responseText);
        throw new Error(errorJson.message || errorJson);
      } catch {
        throw new Error(
          responseText || "Failed to update notification settings"
        );
      }
    }

    // Handle different response types
    try {
      const result = JSON.parse(responseText);

      // Handle both object response and simple number response
      if (typeof result === "number") {
        return {
          message: result > 0 ? "Update successful" : "No changes made",
        };
      }

      if (result.message) {
        return result;
      }

      return { message: "Notification settings updated successfully" };
    } catch {
      // If response is not JSON but is successful
      if (responseText && !isNaN(Number(responseText))) {
        const rowsAffected = parseInt(responseText);
        return {
          message: rowsAffected > 0 ? "Update successful" : "No changes made",
        };
      }

      return {
        message: responseText || "Notification settings updated successfully",
      };
    }
  },

  // Change password
  /*async changePassword(
    userId: string,
    passwordData: Omit<ChangePasswordData, "userID"> // Exclude userID from parameter
  ): Promise<{ message: string }> {
    const requestData: ChangePasswordData = {
      ...passwordData,
      userProfileID: userId, // Include userID in the request body
    };

    const response = await fetch(
      `${API_BASE_URL}UserProfile/change-password/${userId}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || "Failed to change password");
    }

    return response.json();
  },*/

  // Change password
  async changePassword(
    userId: string,
    passwordData: Omit<ChangePasswordData, "userProfileID"> // Exclude userProfileID from parameter
  ): Promise<{ message: string }> {
    const requestData = {
      ...passwordData,
      UserProfileID: userId, // Match backend expected field name
    };

    const response = await fetch(
      `${API_BASE_URL}UserProfile/change-password/${userId}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      }
    );

    const responseText = await response.text();
    console.log("Password change raw response:", responseText);

    if (!response.ok) {
      // Try to parse error as JSON
      try {
        const errorJson = JSON.parse(responseText);
        throw new Error(errorJson.message || errorJson);
      } catch {
        throw new Error(responseText || "Failed to change password");
      }
    }

    // Handle different response types
    try {
      const result = JSON.parse(responseText);

      // Handle both object response and simple number response
      if (typeof result === "number") {
        return {
          message:
            result > 0 ? "Password changed successfully" : "No changes made",
        };
      }

      if (result.message) {
        return result;
      }

      return { message: "Password changed successfully" };
    } catch {
      // If response is not JSON but is successful
      if (responseText && !isNaN(Number(responseText))) {
        const rowsAffected = parseInt(responseText);
        return {
          message:
            rowsAffected > 0
              ? "Password changed successfully"
              : "No changes made",
        };
      }

      return { message: responseText || "Password changed successfully" };
    }
  },

  // Update last login
  /*async updateLastLogin(userId: string): Promise<{ message: string }> {
    const requestData = {
      userProfileID: userId, // Include userID in the request body
    };

    const response = await fetch(
      `${API_BASE_URL}UserProfile/last-login/${userId}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to update last login");
    }

    return response.json();
  },*/

  async updateLastLogin(
    userId: string,
    data: Omit<UpdateProfileData, "userProfileID">
  ): Promise<{ message: string }> {
    const requestData = {
      ...data,
      UserProfileID: userId,
    };

    const response = await fetch(
      `${API_BASE_URL}UserProfile/last-login/${userId}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      }
    );

    const responseText = await response.text();
    console.log("Raw response:", responseText);

    if (!response.ok) {
      // Try to parse error as JSON
      try {
        const errorJson = JSON.parse(responseText);
        throw new Error(errorJson.message || errorJson);
      } catch {
        throw new Error(responseText || "Failed to update profile");
      }
    }

    // Handle different response types
    try {
      const result = JSON.parse(responseText);

      // Handle both object response and simple number response
      if (typeof result === "number") {
        return {
          message: result > 0 ? "Update successful" : "No changes made",
        };
      }

      if (result.message) {
        return result;
      }

      return { message: "Update successful" };
    } catch {
      // If response is not JSON but is successful
      if (responseText && !isNaN(Number(responseText))) {
        const rowsAffected = parseInt(responseText);
        return {
          message: rowsAffected > 0 ? "Update successful" : "No changes made",
        };
      }

      return { message: responseText || "Update successful" };
    }
  },
};
