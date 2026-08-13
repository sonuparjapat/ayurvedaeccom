"use client"

import { User } from "@/app/types/user"
import { FormEvent, useState } from "react"
import api from "@/lib/axios"

interface Props {
  user: User
}

export default function EditUserForm({ user }: Props) {

  const [form, setForm] = useState<User>(user)

  function change(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {

    setForm({
      ...form,
      [e.target.name]: e.target.value,
    })
  }

  async function submit(e: FormEvent) {

    e.preventDefault()

    await api.put(`/auth/user/${user.id}`, form)

    alert("Updated Successfully")
  }

  return (

    <form
      onSubmit={submit}
      className="space-y-4 bg-white p-6 rounded-lg shadow"
    >

      <input
        name="first_name"
        value={form.first_name}
        onChange={change}
        className="input"
        placeholder="Name"
      />

      <input
        name="email"
        value={form.email}
        onChange={change}
        className="input"
      />

      <select
        name="role"
        value={form.role}
        onChange={change}
        className="input"
      >

        <option value="1">Super Admin</option>
        <option value="2">Admin</option>
        <option value="3">User</option>

      </select>

      <button
        type="submit"
        className="w-full bg-indigo-600 text-white py-2 rounded"
      >
        Update
      </button>

    </form>
  )
}