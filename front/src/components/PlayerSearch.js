import React, { useState, useCallback, useEffect } from 'react';
import SearchControls from './SearchControls';
import Pagination from './Pagination';
import { fetchPlayerColumns, fetchPlayerData } from './api';

const PlayerSearch = ({ servers }) => {
  const [selectedServer, setSelectedServer] = useState(null);
  const [playerColumns, setPlayerColumns] = useState([]);
  const [selectedColumn, setSelectedColumn] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [playerData, setPlayerData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleServerSelect = async (server) => {
    setSelectedServer(server);
    setSearchTerm('');
    setCurrentPage(1);
    setPlayerData([]);
    try {
      const columns = await fetchPlayerColumns(server.db_name);
      console.log('Fetched columns:', columns);
      setPlayerColumns(columns);
      setSelectedColumn(columns[0]);
    } catch (err) {
      console.error('Error fetching columns:', err);
      setError(err.message);
    }
  };

  const loadPlayerData = useCallback((page = 1, column, search) => {
    if (!selectedServer) return;
    setIsLoading(true);
    console.log(`Fetching data for ${selectedServer.db_name}, page ${page}, column ${column}, search ${search}`);
    fetchPlayerData(selectedServer.db_name, page, column, search)
      .then(response => {
        console.log('Server response:', response);
        setPlayerData(response.data);
        setTotalPages(response.total_pages);
        setCurrentPage(page);
      })
      .catch(err => {
        console.error('Error fetching player data:', err);
        setError(err.message);
      })
      .finally(() => setIsLoading(false));
  }, [selectedServer]);

  const handleSearch = () => {
    loadPlayerData(1, selectedColumn, searchTerm);
  };

  const handlePageChange = (newPage) => {
    loadPlayerData(newPage, selectedColumn, searchTerm);
  };

  useEffect(() => {
    console.log('Current playerData:', playerData);
  }, [playerData]);

  if (error) {
    console.error('Render error:', error);
    return <div className="error">Error: {error}</div>;
  }

  return (
    <div className="player-search">
      <h2>Search Players</h2>
      <select onChange={(e) => handleServerSelect(JSON.parse(e.target.value))}>
        <option value="">Select a server</option>
        {servers.map((server) => (
          <option key={server.id} value={JSON.stringify(server)}>
            {server.name}
          </option>
        ))}
      </select>
      {selectedServer && (
        <>
          <SearchControls
            columns={playerColumns}
            selectedColumn={selectedColumn}
            onColumnChange={setSelectedColumn}
            searchTerm={searchTerm}
            onSearchTermChange={setSearchTerm}
            onSearch={handleSearch}
          />
          {isLoading ? (
            <div className="loading">Loading data...</div>
          ) : playerData.length > 0 ? (
            <>
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      {Object.keys(playerData[0]).map((key) => (
                        <th key={key}>{key}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {playerData.map((player, index) => (
                      <tr key={index}>
                        {Object.values(player).map((value, cellIndex) => (
                          <td key={cellIndex}>{String(value)}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            </>
          ) : (
            <div className="no-results">No results found.</div>
          )}
        </>
      )}
    </div>
  );
};

export default PlayerSearch;