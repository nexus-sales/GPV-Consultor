import React from 'react'

// Interfaces para el componente Table
interface TableColumn {
  key: string
  label: string
}

interface TableProps<T extends Record<string, unknown>> {
  columns: TableColumn[]
  data: T[]
  className?: string
}

const Table = <T extends Record<string, unknown>>({
  columns,
  data,
  className = ''
}: TableProps<T>) => {
  return (
    <div
      className={`overflow-x-auto bg-white dark:bg-gray-800 rounded-2xl border ${className}`}
    >
      <table className="min-w-full text-sm">
        <thead className="bg-slate-100 text-slate-600">
          <tr>
            {columns.map((column) => (
              <th key={column.key} className="text-left px-3 py-2">
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, index) => (
            <tr
              key={`table-row-${index}`}
              className="odd:bg-white dark:bg-gray-800 even:bg-slate-50"
            >
              {columns.map((column) => (
                <td key={column.key} className="px-3 py-2">
                  {row[column.key] as React.ReactNode}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default Table
