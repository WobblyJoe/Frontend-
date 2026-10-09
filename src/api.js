
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Something went wrong");
  }

  return data;
}

export const api = {
  getGroups: () => request("/api/groups"),

  getGroup: (id) => request(`/api/groups/${id}`),

  createGroup: (body) =>
    request("/api/groups", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  addExpense: (id, body) =>
    request(`/api/groups/${id}/expenses`, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  deleteExpense: (groupId, expenseId) =>
    request(`/api/groups/${groupId}/expenses/${expenseId}`, {
      method: "DELETE",
    }),
};
