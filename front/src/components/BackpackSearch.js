import React, { useState, useCallback, useEffect } from 'react';
import { fetchBackpackColumns, fetchBackpackData } from './api';
import './BackpackSearch.css';

const BackpackSearch = ({ servers }) => {
  const [selectedServer, setSelectedServer] = useState(null);
  const [backpackColumns, setBackpackColumns] = useState([]);
  const [selectedColumn, setSelectedColumn] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [backpackData, setBackpackData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleServerSelect = async (server) => {
    setSelectedServer(server);
    setSearchTerm('');
    setBackpackData([]);
    try {
      const columns = await fetchBackpackColumns(server.db_name);
      setBackpackColumns(columns);
      setSelectedColumn(columns[0]);
    } catch (err) {
      setError(err.message);
    }
  };

  const loadBackpackData = useCallback(() => {
    if (!selectedServer) return;
    setIsLoading(true);
    fetchBackpackData(selectedServer.db_name, 1, selectedColumn, searchTerm)
      .then(response => {
        setBackpackData(response.data.slice(0, 20)); // 최대 20개 아이템만 표시
      })
      .catch(err => {
        setError(err.message);
      })
      .finally(() => setIsLoading(false));
  }, [selectedServer, selectedColumn, searchTerm]);

  const handleSearch = (e) => {
    e.preventDefault();
    loadBackpackData();
  };

  if (error) {
    return <div className="error">Error: {error}</div>;
  }

  return (
    <div className="backpack-search">
      <h2>Search Backpack</h2>
      <form onSubmit={handleSearch} className="search-form">
        <select 
          value={selectedServer ? JSON.stringify(selectedServer) : ''}
          onChange={(e) => handleServerSelect(JSON.parse(e.target.value))}
        >
          <option value="">Select a server</option>
          {servers.map((server) => (
            <option key={server.id} value={JSON.stringify(server)}>
              {server.name}
            </option>
          ))}
        </select>
        <select 
          value={selectedColumn}
          onChange={(e) => setSelectedColumn(e.target.value)}
        >
          {backpackColumns.map((column) => (
            <option key={column} value={column}>{column}</option>
          ))}
        </select>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search..."
        />
        <button type="submit">Search</button>
      </form>
      {isLoading ? (
        <div className="loading">Loading data...</div>
      ) : backpackData.length > 0 ? (
        <div className="backpack-info">
          <h3>Backpack Items</h3>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  {Object.keys(backpackData[0]).map(key => (
                    <th key={key}>{key}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {backpackData.map((item, index) => (
                  <tr key={index}>
                    {Object.values(item).map((value, i) => (
                      <td key={i}>{value}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="no-results">No backpack items found. Please search for a backpack.</div>
      )}
    </div>
  );
};

export default BackpackSearch;