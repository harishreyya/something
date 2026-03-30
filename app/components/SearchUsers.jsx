"use client";

import { useState, useEffect } from "react";
import UserCard from "./UserCard";

export default function SearchUsers() {
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const delay = setTimeout(() => {
      if (query.trim()) {
        fetchUsers();
      } else {
        setUsers([]);
      }
    }, 500);

    return () => clearTimeout(delay);
  }, [query]);

  const fetchUsers = async () => {
    setLoading(true);

    const res = await fetch(`/api/users/search?q=${query}`);
    const data = await res.json();

    setUsers(data);
    setLoading(false);
  };

  return (
    <div>
      <input
        type="text"
        placeholder="Search by name or email..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full p-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      {loading && <p className="mt-4 text-gray-500">Searching...</p>}

      {!loading && users.length === 0 && query && (
        <p className="mt-4 text-gray-500">No users found</p>
      )}

    
      <div className="mt-4 space-y-3">
        {users.map((user) => (
          <UserCard key={user.id} user={user} />
        ))}
      </div>
    </div>
  );
}