type FormatType = "date" | "datetime";

interface FormatOptions {
  type?: FormatType; // "date" | "datetime"
}

export const formatDate = (
  dateStr: string,
  options: FormatOptions = { type: "date" }
): string => {
  try {
    if (!dateStr) return "-";

    // Convert backend format → ISO
    const iso = dateStr.replace(" ", "T");

    const date = new Date(iso);

    if (isNaN(date.getTime())) return "-";

    /* Only Date */
    if (options.type === "date") {
      return date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    }

    /* Date + Time */
    if (options.type === "datetime") {
      return date.toLocaleString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    }

    return "-";
  } catch (err) {
    return "-";
  }
};