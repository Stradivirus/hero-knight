// src/components/Dashboard.js
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import './Dashboard.css';

const Dashboard = ({ user, onLogout }) => {
  const [tables, setTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState(null);
  const [tableData, setTableData] = useState([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedColumn, setSelectedColumn] = useState('');
  const [columns, setColumns] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchTables();
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchTables = async () => {
    try {
      const response = await axios.get('http://localhost:8000/tables');
      setTables(response.data);
    } catch (error) {
      console.error('Failed to fetch tables:', error);
    }
  };

  const fetchTableColumns = async (tableName) => {
    try {
      const response = await axios.get(`http://localhost:8000/table/${tableName}/columns`);
      setColumns(response.data.columns);
      setSelectedColumn(response.data.columns[0]); // 첫 번째 컬럼을 기본으로 선택
    } catch (error) {
      console.error('Failed to fetch table columns:', error);
    }
  };

  const fetchTableData = useCallback(async (tableName, page = 1, search = '', column = '') => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000)); // 1초 대기
      const response = await axios.get(`http://localhost:8000/table/${tableName}`, {
        params: { page, search_term: search, column, page_size: 30 }
      });
      setTableData(response.data.data);
      setTotalPages(response.data.total_pages);
      setCurrentPage(page);
      console.log("Search results:", response.data); // 디버깅을 위한 로그 추가
    } catch (error) {
      console.error('Failed to fetch table data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleTableSelect = async (tableName) => {
    setSelectedTable(tableName);
    setSearchTerm('');
    setCurrentPage(1);
    await fetchTableColumns(tableName);
    fetchTableData(tableName);
  };

  const handleSearch = () => {
    if (selectedTable) {
      fetchTableData(selectedTable, 1, searchTerm, selectedColumn);
    }
  };

  const handlePageChange = (newPage) => {
    if (selectedTable) {
      fetchTableData(selectedTable, newPage, searchTerm, selectedColumn);
    }
  };

  return (
    <div className="dashboard">
      <header>
        <h1>Welcome, {user.username}!</h1>
        <div className="header-right">
          <div className="time">{currentTime.toLocaleTimeString()}</div>
          <button onClick={onLogout} className="logout-btn">Logout</button>
        </div>
      </header>
      <div className="dashboard-content">
        <aside className="sidebar">
          <h2>Tables:</h2>
          <ul>
            {tables.map((table) => (
              <li key={table.name} onClick={() => handleTableSelect(table.name)}>
                {table.name} ({table.record_count})
              </li>
            ))}
          </ul>
        </aside>
        <main>
          {selectedTable ? (
            <div className="table-view">
              <h2>{selectedTable}</h2>
              <div className="search-controls">
                <select 
                  value={selectedColumn} 
                  onChange={(e) => setSelectedColumn(e.target.value)}
                >
                  {columns.map((column) => (
                    <option key={column} value={column}>{column}</option>
                  ))}
                </select>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search..."
                />
                <button onClick={handleSearch}>Search</button>
              </div>
              {isLoading ? (
                <div className="loading">Loading...</div>
              ) : (
                <>
                  <table>
                    <thead>
                      <tr>
                        {tableData.length > 0 && Object.keys(tableData[0]).map((key) => (
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
                  <div className="pagination">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </button>
                    <span>Page {currentPage} of {totalPages}</span>
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="no-table-selected">
              Please select a table from the sidebar to view its data.
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Dashboard;