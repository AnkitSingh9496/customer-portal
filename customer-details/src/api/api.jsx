const BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const seedUsers = async () => {
  const response = await fetch(`${BASE_URL}/seed`);
  return response.json();
};

export const fetchUsers = async () => {
  const response = await fetch(BASE_URL);

  if (!response.ok) {
    throw new Error("Failed to fetch users");
  }
  return response.json();
};

export const updateUser = async (uuid, payload) => {
  const response = await fetch(`${BASE_URL}/${uuid}`, {
    method: "PUT",

    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  return response.json();
};

export const deleteUser = async (uuid) => {
  const response = await fetch(`${BASE_URL}/${uuid}`, {
    method: "DELETE",
  });
  return response.json();
};

export const compareUsers = async (ids) => {
  const response = await fetch(`${BASE_URL}/compare`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ ids }),
  });

  return response.json();
};

// export const mergeUsers = async (masterId, mergeIds) => {
//   const response = await fetch(`${BASE_URL}/merge`, {
//     method: "POST",
//     headers: {
//       "Content-Type": "application/json",
//     },
//     body: JSON.stringify({
//       masterId,
//       mergeIds,
//     }),
//   });

//   return response.json();
// };

export const mergeUsers = async (masterId, mergeIds, masterData) => {
  const response = await fetch("http://localhost:5000/api/users/merge", {
    method: "POST",

    headers: {
      "Content-Type": "application/json",
    },

    body: JSON.stringify({
      masterId,
      mergeIds,
      masterData,
    }),
  });

  return response.json();
};
