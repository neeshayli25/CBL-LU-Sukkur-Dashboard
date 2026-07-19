import MockAdapter from "axios-mock-adapter";
import { apiClient } from "./client";

export const setupMockApi = () => {
  const mock = new MockAdapter(apiClient, { delayResponse: 800 });

  console.warn("MOCK API ACTIVATED: Intercepting @cbl/api requests.");

  // Mock Login (Exchanging MS code for JWT)
  mock.onPost("/auth/login").reply((config) => {
    // We would parse config.data to see the auth code
    // and return a mock JWT based on some condition
    const _data = JSON.parse(config.data);
    console.log("Mock Login Received Payload:", _data);
    
    // Simulate a JWT token structure that jwt-decode can parse
    // A JWT has 3 parts separated by dots. We just care about the middle part (payload) being base64 JSON.
    const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
    const payload = btoa(
      JSON.stringify({
        id: "usr_123",
        name: "Test Employee",
        email: "employee@cbl.com",
        roles: ["Employee"], // Change to ["Admin", "Manager"] to test dashboard
        department: "Operations",
        exp: Math.floor(Date.now() / 1000) + (60 * 60) // 1 hour expiry
      })
    );
    const signature = "dummy_signature";
    
    return [
      200,
      {
        jwt: `${header}.${payload}.${signature}`
      }
    ];
  });

  // Mock fetching incidents
  mock.onGet("/incidents").reply((config) => {
    // Optional: Check auth header
    if (!config.headers?.Authorization) {
      return [401, { message: "Unauthorized" }];
    }
    
    return [
      200,
      {
        data: [
          { id: "INC-001", title: "Boiler leak in Sector 4", status: "Open", reportedBy: "John Doe" },
          { id: "INC-002", title: "Conveyor Belt Stalled", status: "Resolved", reportedBy: "Jane Smith" },
        ]
      }
    ];
  });

  // Mock creating incident
  mock.onPost("/incidents").reply((config) => {
    if (!config.headers?.Authorization) return [401, {}];
    const data = JSON.parse(config.data);
    return [201, { message: "Incident reported successfully", id: `INC-${Math.floor(Math.random() * 1000)}`, ...data }];
  });

  // Pass through any other requests (like Ali's real backend endpoints)
  mock.onAny().passThrough();

  return mock;
};
