import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const SearchBar = () => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setShowDropdown(false);
      return;
    }

    const fetchResults = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem("token"); // get JWT token
        if (!token) {
          setError("You must be logged in to search inventories");
          setResults([]);
          setShowDropdown(true);
          setLoading(false);
          return;
        }

        const res = await axios.get(
          `${process.env.REACT_APP_API_URL}/api/inventories/search?q=${encodeURIComponent(query)}`,
          {
            headers: {
              Authorization: `Bearer ${token}`, // send JWT token
            },
          }
        );

        setResults(res.data);
        setShowDropdown(true);
      } catch (err) {
        console.error("Search error:", err);
        setError(err.response?.data?.message || "Failed to fetch results");
        setResults([]);
        setShowDropdown(true);
      } finally {
        setLoading(false);
      }
    };

    const timeoutId = setTimeout(() => fetchResults(), 300); // debounce
    return () => clearTimeout(timeoutId);
  }, [query]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="position-relative" ref={dropdownRef}>
      <input
        type="text"
        className="form-control"
        placeholder="Search inventories..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => query && setShowDropdown(true)}
      />

      {showDropdown && (
        <ul className="list-group position-absolute w-100" style={{ zIndex: 1000 }}>
          {loading && <li className="list-group-item text-center">Loading...</li>}
          {error && <li className="list-group-item text-danger">{error}</li>}
          {!loading && !error && results.length === 0 && (
            <li className="list-group-item text-center">No results found</li>
          )}
          {!loading &&
            !error &&
            results.map((inv) => (
              <li
                key={inv._id}
                className="list-group-item list-group-item-action"
                style={{ cursor: "pointer" }}
                onClick={() => {
                  navigate(`/inventory/${inv._id}`);
                  setShowDropdown(false);
                  setQuery("");
                }}
              >
                <strong>{inv.title}</strong> - <em>{inv.category}</em>
              </li>
            ))}
        </ul>
      )}
    </div>
  );
};

export default SearchBar;
