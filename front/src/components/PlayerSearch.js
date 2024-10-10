import React, { useState, useCallback } from 'react';
import { fetchPlayerColumns, fetchPlayerData } from './api';
import './PlayerSearch.css';

const PlayerSearch = ({ servers }) => {
  const [selectedServer, setSelectedServer] = useState(null);
  const [playerColumns, setPlayerColumns] = useState([]);
  const [selectedColumn, setSelectedColumn] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [playerData, setPlayerData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleServerSelect = async (server) => {
    setSelectedServer(server);
    setSearchTerm('');
    setPlayerData(null);
    try {
      const columns = await fetchPlayerColumns(server.db_name);
      setPlayerColumns(columns);
      setSelectedColumn(columns[0]);
    } catch (err) {
      setError(err.message);
    }
  };

  const loadPlayerData = useCallback(() => {
    if (!selectedServer) return;
    setIsLoading(true);
    fetchPlayerData(selectedServer.db_name, 1, selectedColumn, searchTerm)
      .then(response => {
        setPlayerData(response.data[0]);
      })
      .catch(err => {
        setError(err.message);
      })
      .finally(() => setIsLoading(false));
  }, [selectedServer, selectedColumn, searchTerm]);

  const handleSearch = (e) => {
    e.preventDefault();
    loadPlayerData();
  };

  if (error) {
    return <div className="error">Error: {error}</div>;
  }

  return (
    <div className="player-search">
      <h2>Search Players</h2>
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
          {playerColumns.map((column) => (
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
      ) : playerData ? (
        <div className="player-info">
          <h3>Player Information</h3>
          <div className="info-grid">
            {Object.entries(playerData).map(([key, value]) => (
              <div key={key} className="info-item">
                <span className="info-label">{key}:</span>
                <span className="info-value">{value}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="no-results">No player found. Please search for a player.</div>
      )}
    </div>
  );
};

export default PlayerSearch;