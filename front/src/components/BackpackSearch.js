import React, { useState, useCallback, useEffect } from 'react';
import SearchControls from './SearchControls';
import Pagination from './Pagination';
import { fetchBackpackColumns, fetchBackpackData } from './api';

const BackpackSearch = ({ servers }) => {
  const [selectedServer, setSelectedServer] = useState(null);
  const [backpackColumns, setBackpackColumns] = useState([]);
  const [selectedColumn, setSelectedColumn] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [backpackData, setBackpackData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleServerSelect = async (server) => {
    setSelectedServer(server);
    setSearchTerm('');
    setCurrentPage(1);
    setBackpackData([]);
    try {
      const columns = await fetchBackpackColumns(server.db_name);
      console.log('Fetched columns:', columns);
      setBackpackColumns(columns);
      setSelectedColumn(columns[0]);
    } catch (err) {
      console.error('Error fetching columns:', err);
      setError(err.message);
    }
  };

  const loadBackpackData = useCallback((page = 1, column, search) => {
    if (!selectedServer) return;
    setIsLoading(true);
    console.log(`Fetching data for ${selectedServer.db_name}, page ${page}, column ${column}, search ${search}`);
    fetchBackpackData(selectedServer.db_name, page, column, search)
      .then(response => {
        console.log('Server response:', response);
        setBackpackData(response.data);
        setTotalPages(response.total_pages);
        setCurrentPage(page);
      })
      .catch(err => {
        console.error('Error fetching backpack data:', err);
        setError(err.message);
      })
      .finally(() => setIsLoading(false));
  }, [selectedServer]);

  const handleSearch = () => {
    loadBackpackData(1, selectedColumn, searchTerm);
  };

  const handlePageChange = (newPage) => {
    loadBackpackData(newPage, selectedColumn, searchTerm);
  };

  useEffect(() => {
    console.log('Current backpackData:', backpackData);
  }, [backpackData]);

  if (error) {
    console.error('Render error:', error);
    return <div className="error">Error: {error}</div>;
  }

  return (
    <div className="backpack-search">
      <h2>Search Backpack</h2>
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
            columns={backpackColumns}
            selectedColumn={selectedColumn}
            onColumnChange={setSelectedColumn}
            searchTerm={searchTerm}
            onSearchTermChange={setSearchTerm}
            onSearch={handleSearch}
          />
          {isLoading ? (
            <div className="loading">Loading data...</div>
          ) : backpackData.length > 0 ? (
            <>
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      {Object.keys(backpackData[0]).map((key) => (
                        <th key={key}>{key}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {backpackData.map((item, index) => (
                      <tr key={index}>
                        {Object.values(item).map((value, cellIndex) => (
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

export default BackpackSearch;