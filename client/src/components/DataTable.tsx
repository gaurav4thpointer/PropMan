import { useState, useMemo } from 'react'

function getNestedValue(obj: unknown, path: string): unknown {
  if (!path) return obj
  const parts = path.split('.')
  let current: unknown = obj
  for (const p of parts) {
    current = current != null && typeof current === 'object' && p in current
      ? (current as Record<string, unknown>)[p]
      : undefined
  }
  return current
}

function compare(a: unknown, b: unknown, dir: 'asc' | 'desc'): number {
  const na = a == null ? '' : String(a)
  const nb = b == null ? '' : String(b)
  const numA = Number(a)
  const numB = Number(b)
  if (!Number.isNaN(numA) && !Number.isNaN(numB)) {
    return dir === 'asc' ? numA - numB : numB - numA
  }
  const cmp = na.localeCompare(nb, undefined, { numeric: true })
  return dir === 'asc' ? cmp : -cmp
}

export interface DataTableColumn<T> {
  key: string
  label: string
  sortKey?: string
  getSortValue?: (row: T) => unknown
  getSearchValue?: (row: T) => string
  searchable?: boolean
  sortable?: boolean
  render: (row: T) => React.ReactNode
  align?: 'left' | 'right'
}

interface DataTableProps<T> {
  data: T[]
  columns: DataTableColumn<T>[]
  idKey: keyof T
  searchPlaceholder?: string
  rowsPerPageOptions?: number[]
  defaultRowsPerPage?: number
  extraToolbar?: React.ReactNode
  emptyMessage?: string
  variant?: 'default' | 'dark'
}

const variantClasses = {
  default: {
    wrapper: '',
    toolbarBorder: 'border-slate-100',
    searchInput:
      'w-full min-w-0 max-w-xs rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 sm:max-w-xs',
    clearBtn: 'text-sm text-slate-600 hover:text-slate-800 underline',
    table: 'min-w-full',
    th: (col: { align?: 'left' | 'right' }, canSort: boolean, isSorted: boolean) =>
      `whitespace-nowrap py-3 pr-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-600 ${col.align === 'right' ? 'text-right pl-4' : ''} ${isSorted ? 'text-indigo-600' : ''} ${canSort ? 'cursor-pointer select-none hover:bg-slate-50' : ''}`,
    sortIndicator: 'text-indigo-500',
    tr: 'border-t border-slate-100 hover:bg-slate-50/50',
    td: 'whitespace-nowrap py-3 pr-4 text-sm text-slate-800',
    empty: 'px-5 py-12 text-center text-slate-500',
    footerBorder: 'border-slate-100',
    footerText: 'text-sm text-slate-600',
    footerSelect: 'rounded-lg border border-slate-200 bg-white px-2 py-1 text-sm',
    pageInfo: 'text-sm text-slate-500',
    paginationBtn: 'btn-secondary text-sm disabled:opacity-50',
  },
  dark: {
    wrapper: 'rounded-2xl border border-slate-700/80 bg-slate-800/50 overflow-hidden',
    toolbarBorder: 'border-slate-700',
    searchInput:
      'w-full min-w-0 max-w-xs rounded-xl border border-slate-600 bg-slate-800 px-4 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 sm:max-w-xs',
    clearBtn: 'text-sm text-slate-400 hover:text-white underline',
    table: 'w-full min-w-[600px] text-left text-sm',
    th: (col: { align?: 'left' | 'right' }, canSort: boolean, isSorted: boolean) =>
      `whitespace-nowrap px-5 py-4 font-semibold ${col.align === 'right' ? 'text-right' : ''} ${isSorted ? 'text-amber-400' : 'text-slate-300'} ${canSort ? 'cursor-pointer select-none hover:bg-slate-700/50' : ''}`,
    sortIndicator: 'text-amber-500',
    tr: 'border-b border-slate-700/50 transition-colors hover:bg-slate-700/30',
    td: 'px-5 py-3 text-slate-200',
    empty: 'px-5 py-12 text-center text-slate-500',
    footerBorder: 'border-slate-700',
    footerText: 'text-sm text-slate-400',
    footerSelect: 'rounded-xl border border-slate-600 bg-slate-700 px-2 py-1 text-sm text-slate-200',
    pageInfo: 'text-sm text-slate-400',
    paginationBtn: 'rounded-xl border border-slate-600 bg-slate-700 px-4 py-2 text-sm font-medium text-slate-300 disabled:opacity-50 hover:bg-slate-600 hover:text-white',
  },
}

export default function DataTable<T>({
  data,
  columns,
  idKey,
  searchPlaceholder = 'Search...',
  rowsPerPageOptions = [10, 20, 50, 100],
  defaultRowsPerPage = 20,
  extraToolbar,
  emptyMessage = 'No data.',
  variant = 'default',
}: DataTableProps<T>) {
  const c = variantClasses[variant]
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [page, setPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(defaultRowsPerPage)

  const filtered = useMemo(() => {
    let result = data
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      const searchableCols = columns.filter((c) => c.searchable !== false)
      result = data.filter((row) => {
        const combined = searchableCols
          .map((c) => c.getSearchValue ? c.getSearchValue(row) : getNestedValue(row, c.key))
          .map((v) => (v == null ? '' : String(v)))
          .join(' ')
          .toLowerCase()
        return combined.includes(q)
      })
    }
    return result
  }, [data, search, columns])

  const sorted = useMemo(() => {
    if (!sortKey) return filtered
    const col = columns.find((c) => c.key === sortKey)
    if (col?.sortable === false) return filtered
    if (col?.getSortValue) {
      return [...filtered].sort((a, b) =>
        compare(col.getSortValue!(a), col.getSortValue!(b), sortDir)
      )
    }
    const key = col?.sortKey ?? sortKey
    return [...filtered].sort((a, b) =>
      compare(getNestedValue(a, key), getNestedValue(b, key), sortDir)
    )
  }, [filtered, sortKey, sortDir, columns])

  const totalFiltered = sorted.length
  const totalPages = Math.max(1, Math.ceil(totalFiltered / rowsPerPage))
  const currentPage = Math.min(page, totalPages)
  const start = (currentPage - 1) * rowsPerPage
  const pageData = sorted.slice(start, start + rowsPerPage)

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
    setPage(1)
  }

  const searchBar = (
    <div className={`flex flex-wrap items-center gap-3 border-b ${c.toolbarBorder} px-4 py-3 sm:px-5 ${variant === 'dark' ? 'bg-slate-800/50' : 'bg-slate-50/80'}`}>
      <input
        type="search"
        placeholder={searchPlaceholder}
        value={search}
        onChange={(e) => {
          setSearch(e.target.value)
          setPage(1)
        }}
        className={c.searchInput}
        aria-label="Search table"
      />
      {extraToolbar}
      {(search || sortKey) && (
        <button
          type="button"
          onClick={() => {
            setSearch('')
            setSortKey(null)
            setSortDir('asc')
            setPage(1)
          }}
          className={c.clearBtn}
        >
          Clear
        </button>
      )}
    </div>
  )

  return (
    <div className={variant === 'dark' ? c.wrapper : 'table-wrapper'}>
      {searchBar}
      <div className="overflow-x-auto">
        <table className={c.table}>
          <thead>
            <tr className={variant === 'dark' ? 'border-b border-slate-700 bg-slate-800/80' : ''}>
              {columns.map((col) => {
                const canSort = col.sortable !== false
                const isSorted = sortKey === col.key
                return (
                  <th
                    key={col.key}
                    className={c.th(col, canSort, isSorted)}
                    onClick={() => canSort && handleSort(col.key)}
                  >
                    <span className="inline-flex items-center gap-1">
                      {col.label}
                      {isSorted && (
                        <span className={c.sortIndicator} aria-hidden>
                          {sortDir === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </span>
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {pageData.map((row) => (
              <tr key={String(row[idKey])} className={c.tr}>
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={`${c.td} ${col.align === 'right' ? 'text-right' : ''}`}
                  >
                    {col.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pageData.length === 0 && (
        <p className={c.empty}>{emptyMessage}</p>
      )}

      {(totalFiltered > 0 || search) && (
        <div className={`flex flex-col gap-3 border-t ${c.footerBorder} px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5`}>
          <div className={`flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4 ${c.footerText}`}>
            <span className="whitespace-nowrap">
              Showing {start + 1}–{Math.min(start + rowsPerPage, totalFiltered)} of {totalFiltered}
            </span>
            <label className="flex shrink-0 items-center gap-2 whitespace-nowrap">
              Rows per page
              <select
                value={rowsPerPage}
                onChange={(e) => {
                  setRowsPerPage(Number(e.target.value))
                  setPage(1)
                }}
                className={c.footerSelect}
              >
                {rowsPerPageOptions.map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </label>
          </div>
          <div className="flex shrink-0 items-center gap-2 whitespace-nowrap">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setPage((p) => p - 1)}
              className={c.paginationBtn}
            >
              Previous
            </button>
            <span className={c.pageInfo}>
              Page {currentPage} of {totalPages}
            </span>
            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className={c.paginationBtn}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
