import React, { useState, useEffect } from 'react';
import TableView from './TableView';
import PlayerSearch from './PlayerSearch';
import BackpackSearch from './BackpackSearch';
import Sidebar from './Sidebar';
import { fetchTables, fetchServers } from './api';
import './Dashboard.css';
import './PlayerSearch.css';
import './BackpackSearch.css';

const Dashboard = ({ user, onLogout }) => {
  const [tables, setTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [servers, setServers] = useState([]);
  const [isPlayerSearch, setIsPlayerSearch] = useState(false);
  const [isBackpackSearch, setIsBackpackSearch] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTables().then(setTables).catch(err => setError(err.message));
    fetchServers().then(setServers).catch(err => setError(err.message));
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleTableSelect = (tableName) => {
    setSelectedTable(tableName);
    setIsPlayerSearch(false);
    setIsBackpackSearch(false);
  };

  const handlePlayerSearchClick = () => {
    setIsPlayerSearch(true);
    setIsBackpackSearch(false);
    setSelectedTable(null);
  };

  const handleBackpackSearchClick = () => {
    setIsBackpackSearch(true);
    setIsPlayerSearch(false);
    setSelectedTable(null);
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
        <Sidebar 
          tables={tables} 
          selectedTable={selectedTable} 
          onTableSelect={handleTableSelect}
          onPlayerSearchClick={handlePlayerSearchClick}
          onBackpackSearchClick={handleBackpackSearchClick}
        />
        <main>
          {error && <div className="error">{error}</div>}
          {isPlayerSearch ? (
            <PlayerSearch servers={servers} />
          ) : isBackpackSearch ? (
            <BackpackSearch servers={servers} />
          ) : selectedTable ? (
            <TableView tableName={selectedTable} />
          ) : (
            <div className="no-table-selected">
              Please select a table from the sidebar or use the User Search or Backpack Search feature.
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Dashboard;