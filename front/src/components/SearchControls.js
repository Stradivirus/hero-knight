import React from 'react';

const SearchControls = ({
  columns,
  selectedColumn,
  onColumnChange,
  searchTerm,
  onSearchTermChange,
  onSearch
}) => {
  return (
    <div className="search-controls">
      <select 
        value={selectedColumn} 
        onChange={(e) => onColumnChange(e.target.value)}
      >
        {columns.map((column) => (
          <option key={column} value={column}>{column}</option>
        ))}
      </select>
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => onSearchTermChange(e.target.value)}
        placeholder="Search..."
      />
      <button onClick={onSearch}>Search</button>
    </div>
  );
};

export default SearchControls;