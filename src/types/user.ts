export interface LoginRequest {
  nip?: string;
  password?: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface Role {
  id: number;
  role: string;
}

export interface User {
  id: number;
  name: string;
  nip: string;
  roles?: Role[];
  created_at: string;
  updated_at: string;
}

export function getUserRoleId(user: User | null | undefined): number | undefined {
  if (!user) return undefined;
  if (user.roles && user.roles.length > 0) return user.roles[0].id;
  return undefined;
}

export interface UserFormData {
  name: string;
  nip: string;
  password?: string;
  roles: number[];
}

export interface PaginatedUsersResponse {
  current_page: number;
  data: User[];
  last_page: number;
  per_page: number;
  total: number;
}
