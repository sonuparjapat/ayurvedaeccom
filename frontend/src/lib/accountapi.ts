import axios from "@/lib/axios";

/* ================= PROFILE ================= */

export const getProfile = () =>
  axios.get("/users/me");

export const updateProfile = (data: any) =>
  axios.put("/users/profile", data);

export const changePassword = (data: any) =>
  axios.put("/users/change-password", data);


/* ================= ADDRESS ================= */

export const getAddresses = () =>
  axios.get("/users/address");

export const addAddress = (data: any) =>
  axios.post("/users/address", data);

export const updateAddress = (id: string, data: any) =>{
 return axios.put(`/users/address/${id}`, data);}

export const deleteAddress = (id: string) =>
  axios.delete(`/users/address/${id}`);

export const setDefaultAddress = (id: string) =>
  axios.put(`/users/address/default/${id}`);


/* ================= SETTINGS ================= */

export const getSettings = () =>
  axios.get("/users/settings");

export const updateSettings = (data: any) =>
  axios.put("/users/settings", data);


/* ================= ACCOUNT ================= */

export const deleteAccount = () =>
  axios.delete("/users/account");

export const exportData = () =>
  axios.get("/users/export", { responseType: "blob" });