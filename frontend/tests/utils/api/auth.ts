import { APIRequestContext } from '@playwright/test';
import { faker } from '@faker-js/faker';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:8080/api/v1';

export interface UserData {
  email: string;
  first_name: string;
  last_name: string;
  domain: string[];
  password: string;
}

export interface RegisteredUser {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  domain: string[];
  access_token: string;
  created_at: string;
  updated_at: string;
}

/**
 * Register a new user via API
 * @param request - Playwright APIRequestContext
 * @param userData - User registration data
 * @returns Registered user with access token
 */
export async function registerUser(
  request: APIRequestContext,
  userData: UserData
): Promise<RegisteredUser> {
  const response = await request.post(`${API_BASE_URL}/auth/register`, {
    data: {
      user: {
        email: userData.email,
        first_name: userData.first_name,
        last_name: userData.last_name,
        domain: userData.domain,
      },
      password: userData.password,
    },
  });

  if (!response.ok()) {
    const errorBody = await response.text();
    throw new Error(
      `Failed to register user ${userData.email}: ${response.status()} - ${errorBody}`
    );
  }

  const registerData = await response.json();
  
  // Now login to get the token
  const loginResponse = await loginUser(request, userData.email, userData.password);
  
  return {
    ...registerData.data,
    access_token: loginResponse.access_token,
  };
}

/**
 * Login user and get JWT token
 * @param request - Playwright APIRequestContext
 * @param email - User email
 * @param password - User password
 * @returns User data with access token
 */
export async function loginUser(
  request: APIRequestContext,
  email: string,
  password: string
): Promise<RegisteredUser> {
  const response = await request.post(`${API_BASE_URL}/auth/login`, {
    data: {
      email,
      password,
    },
  });

  if (!response.ok()) {
    const errorBody = await response.text();
    throw new Error(
      `Failed to login user ${email}: ${response.status()} - ${errorBody}`
    );
  }

  const loginData = await response.json();
  
  return {
    ...loginData.data.user,
    access_token: loginData.data.token,
  };
}

/**
 * Generate random user data using Faker
 * @param domain - User domain/expertise areas
 * @returns UserData object
 */
export function generateUserData(domain: string[] = ['Computer Science']): UserData {
  return {
    email: faker.internet.email().toLowerCase(),
    first_name: faker.person.firstName(),
    last_name: faker.person.lastName(),
    domain,
    password: 'TestPassword123!', // Use consistent password for tests
  };
}
