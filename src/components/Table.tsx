import React from 'react'

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
      className={`overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800 ${className}`}
    >
      <table className="min-w-full text-sm">
        <thead className="border-b border-gray-100 bg-gray-50 text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide"
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, index) => (
            <tr
              key={`table-row-${index}`}
              className="border-b border-gray-100 last:border-0 dark:border-gray-700"
            >
              {columns.map((column) => (
                <td
                  key={column.key}
                  className="px-4 py-3 text-gray-700 dark:text-gray-200"
                >
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
