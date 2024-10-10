import React from 'react';

const Sidebar = ({ tables, selectedTable, onTableSelect, onPlayerSearchClick, onBackpackSearchClick }) => {
  return (
    <aside className="sidebar">
      <h2>Tables:</h2>
      <ul>
        {tables.map((table) => (
          <li 
            key={table.name} 
            onClick={() => onTableSelect(table.name)}
            className={selectedTable === table.name ? 'active' : ''}
          >
            {table.name} ({table.record_count})
          </li>
        ))}
      </ul>
      <h2>User Information</h2>
      <button onClick={onPlayerSearchClick}>User Search</button>
      <button onClick={onBackpackSearchClick}>Backpack Search</button>
    </aside>
  );
};

export default Sidebar;