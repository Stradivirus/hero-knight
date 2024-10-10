import React, { useState, useEffect, useCallback } from 'react';
import SearchControls from './SearchControls';
import Pagination from './Pagination';
import { fetchTableColumns, fetchTableData } from './api';

const TableView = ({ tableName }) => {
  const [tableData, setTableData] = useState([]);
  const [columns, setColumns] = useState([]);
  const [selectedColumn, setSelectedColumn] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTableColumns(tableName)
      .then(cols => {
        setColumns(cols);
        setSelectedColumn(cols[0]);
      })
      .catch(err => setError(err.message));
  }, [tableName]);

  const loadTableData = useCallback((page = 1, search = '', column = '') => {
    setIsLoading(true);
    fetchTableData(tableName, page, search, column)
      .then(response => {
        setTableData(response.data);
        setTotalPages(response.total_pages);
        setCurrentPage(page);
      })
      .catch(err => setError(err.message))
      .finally(() => setIsLoading(false));
  }, [tableName]);

  useEffect(() => {
    loadTableData(1, searchTerm, selectedColumn);
  }, [loadTableData, searchTerm, selectedColumn]);

  const handleSearch = () => {
    loadTableData(1, searchTerm, selectedColumn);
  };

  const handlePageChange = (newPage) => {
    loadTableData(newPage, searchTerm, selectedColumn);
  };

  if (isLoading) return <div className="loading">Loading data...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="table-view">
      <h2>{tableName}</h2>
      <SearchControls
        columns={columns}
        selectedColumn={selectedColumn}
        onColumnChange={setSelectedColumn}
        searchTerm={searchTerm}
        onSearchTermChange={setSearchTerm}
        onSearch={handleSearch}
      />
      {tableData.length > 0 ? (
        <>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  {Object.keys(tableData[0]).map((key) => (
                    <th key={key}>{key}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tableData.map((row, index) => (
                  <tr key={index}>
                    {Object.values(row).map((value, cellIndex) => (
                      <td key={cellIndex}>
                        {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                      </td>
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
    </div>
  );
};

export default TableView;