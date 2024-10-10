import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

export const fetchTables = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/tables`);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch tables:', error);
    throw new Error('Failed to fetch tables. Please try again later.');
  }
};

export const fetchServers = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/servers`);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch servers:', error);
    throw new Error('Failed to fetch servers. Please try again later.');
  }
};

export const fetchTableColumns = async (tableName) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/table/${tableName}/columns`);
    return response.data.columns;
  } catch (error) {
    console.error('Failed to fetch table columns:', error);
    throw new Error('Failed to fetch table columns. Please try again later.');
  }
};

export const fetchTableData = async (tableName, page = 1, search = '', column = '') => {
  try {
    const response = await axios.get(`${API_BASE_URL}/table/${tableName}`, {
      params: { page, search_term: search, column, page_size: 30 }
    });
    return {
      data: response.data.data,
      total_pages: response.data.total_pages
    };
  } catch (error) {
    console.error('Failed to fetch table data:', error);
    throw new Error('Failed to fetch table data. Please try again later.');
  }
};

export const fetchPlayerColumns = async (dbName) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/player/columns/${dbName}`);
    return response.data.columns;
  } catch (error) {
    console.error('Failed to fetch player columns:', error);
    throw new Error('Failed to fetch player columns. Please try again later.');
  }
};

export const fetchPlayerData = async (dbName, page = 1, column, search) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/player/${dbName}`, {
      params: { page, search_column: column, search_term: search, page_size: 30 }
    });
    return {
      data: response.data.data,
      total_pages: response.data.total_pages
    };
  } catch (error) {
    console.error('Failed to fetch player data:', error);
    throw new Error('Failed to fetch player data. Please try again later.');
  }
};

export const fetchBackpackColumns = async (dbName) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/backpack/columns/${dbName}`);
    return response.data.columns;
  } catch (error) {
    console.error('Failed to fetch backpack columns:', error);
    throw new Error('Failed to fetch backpack columns. Please try again later.');
  }
};

export const fetchBackpackData = async (dbName, page = 1, column, search) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/backpack/${dbName}`, {
      params: { page, search_column: column, search_term: search, page_size: 30 }
    });
    return {
      data: response.data.data,
      total_pages: response.data.total_pages
    };
  } catch (error) {
    console.error('Failed to fetch backpack data:', error);
    throw new Error('Failed to fetch backpack data. Please try again later.');
  }
};