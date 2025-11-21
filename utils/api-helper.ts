export class ApiHelper {
  static async handleApiResponse(response: Response, endpoint: string) {
    if (!response.ok) {
      let errorText = await response.text();

      // Handle empty response
      if (!errorText || errorText.trim() === "") {
        errorText = `Server returned ${response.status} ${response.statusText} without error details`;
      }

      console.error(`❌ API Error [${endpoint}]:`, {
        status: response.status,
        statusText: response.statusText,
        error: errorText,
      });

      throw new Error(
        `Failed to fetch ${endpoint}: ${response.status} ${response.statusText} - ${errorText}`
      );
    }

    // Handle empty response for successful requests
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      try {
        const data = await response.json();
        return data;
      } catch (jsonError) {
        console.error(`❌ JSON Parse Error [${endpoint}]:`, jsonError);
        throw new Error(`Invalid JSON response from ${endpoint}`);
      }
    } else {
      // For non-JSON responses, return as text
      return await response.text();
    }
  }

  static async safeFetch(url: string, options: RequestInit = {}) {
    try {
      console.log(`🌐 API Request: ${url}`, options);

      const response = await fetch(url, {
        headers: {
          "Content-Type": "application/json",
          ...options.headers,
        },
        ...options,
      });

      return await this.handleApiResponse(response, url);
    } catch (error) {
      console.error(`❌ Fetch failed [${url}]:`, error);
      throw error;
    }
  }
}
