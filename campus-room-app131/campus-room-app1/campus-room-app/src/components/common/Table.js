import React from 'react';
import '../../styles/table.css';

/**
 * Reusable Table Component
 * 
 * @param {Object} props
 * @param {Array} props.columns - Array of column definitions { header: string, key: string, render?: Function }
 * @param {Array} props.data - Array of data objects
 * @param {Function} props.onRowClick - Function to call when a row is clicked
 * @param {string} props.emptyMessage - Message to show when there is no data
 */
const Table = ({ columns, data, onRowClick, emptyMessage = 'No data found' }) => {
  return (
    <div className="data-table-container">
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((column, index) => (
              <th key={index}>{column.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="text-center">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, rowIndex) => (
              <tr 
                key={rowIndex}
                onClick={() => onRowClick && onRowClick(row)}
                style={{ cursor: onRowClick ? 'pointer' : 'default' }}
              >
                {columns.map((column, colIndex) => (
                  <td key={`${rowIndex}-${colIndex}`}>
                    {column.render 
                      ? column.render(row[column.key], row) 
                      : row[column.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default Table;