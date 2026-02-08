import Link from "next/link"
import { User } from "@/app/types/user"

interface Props {
  users: User[]
}

export default function UserTable({ users }: Props) {

  return (
    <div className="overflow-x-auto rounded-lg border">

      <table className="w-full text-sm">

        <thead className="bg-gray-100">

          <tr>
            <th className="p-3 text-left">Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Status</th>
            <th>Action</th>
          </tr>

        </thead>

        <tbody>

          {users.map(user => (

            <tr
              key={user.id}
              className="border-t hover:bg-gray-50"
            >

              <td className="p-3">
                {user.first_name}
              </td>

              <td>{user.email}</td>

              <td>

                <span className="px-2 py-1 text-xs rounded bg-indigo-100">

                  {user.role === 1 && "SuperAdmin"}
                  {user.role === 2 && "Admin"}
                  {user.role === 3 && "User"}

                </span>

              </td>

              <td>

                {user.is_verified ? (
                  <span className="text-green-600">
                    Active
                  </span>
                ) : (
                  <span className="text-red-600">
                    Pending
                  </span>
                )}

              </td>

              <td>

                <Link
                  href={`/admin/users/${user.id}`}
                  className="text-indigo-600 hover:underline"
                >
                  View
                </Link>

              </td>

            </tr>

          ))}

        </tbody>

      </table>

    </div>
  )
}