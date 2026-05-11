import { useEffect, useState } from "react";
import { fetchUsers, seedUsers } from "../api/api.jsx";

const useUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      let data = await fetchUsers();

      if (!data.length) {
        await seedUsers();
        data = await fetchUsers();
      }

      setUsers(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  return { users, loading, error, reloadUsers: loadUsers };
};

export default useUsers;
