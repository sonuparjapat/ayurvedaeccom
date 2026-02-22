import axios from "@/lib/axios";

/* ================= PROFILE ================= */

export const getCategories = () =>
  axios.get("/categories");
