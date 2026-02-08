export interface User {
  id: number

  name: string

  email: string
  phone: string | null

  role: 1 | 2 | 3

  is_verified: boolean

  created_at: string
}

export interface Pagination {
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface UsersResponse {
  users: User[]
  pagination: Pagination
}