'use client'

import { useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Search } from 'lucide-react'

interface Column {
  header: string
  accessorKey: string
  cell?: (row: any) => React.ReactNode
}

interface DataTableProps {
  data: any[]
  columns: Column[]
  onRowClick?: (row: any) => void
  searchPlaceholder?: string
}

export function DataTable({ data, columns, onRowClick, searchPlaceholder }: DataTableProps) {
  const [sorting, setSorting] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null)
  const [globalFilter, setGlobalFilter] = useState('')
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 })

  // Filter data
  const filteredData = data.filter((row) => {
    if (!globalFilter) return true
    return Object.values(row).some((value) =>
      String(value).toLowerCase().includes(globalFilter.toLowerCase())
    )
  })

  // Sort data
  const sortedData = [...filteredData].sort((a, b) => {
    if (!sorting) return 0

    const aValue = getNestedValue(a, sorting.key)
    const bValue = getNestedValue(b, sorting.key)

    if (aValue < bValue) return sorting.direction === 'asc' ? -1 : 1
    if (aValue > bValue) return sorting.direction === 'asc' ? 1 : -1
    return 0
  })

  // Paginate data
  const paginatedData = sortedData.slice(
    pagination.pageIndex * pagination.pageSize,
    (pagination.pageIndex + 1) * pagination.pageSize
  )

  const pageCount = Math.ceil(sortedData.length / pagination.pageSize)

  const handleSort = (key: string) => {
    setSorting((prev) => {
      if (prev?.key === key) {
        return prev.direction === 'asc' ? { key, direction: 'desc' } : null
      }
      return { key, direction: 'asc' }
    })
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={searchPlaceholder || 'Search...'}
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          value={pagination.pageSize.toString()}
          onValueChange={(value) =>
            setPagination({ ...pagination, pageSize: parseInt(value), pageIndex: 0 })
          }
        >
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="5">5 per page</SelectItem>
            <SelectItem value="10">10 per page</SelectItem>
            <SelectItem value="20">20 per page</SelectItem>
            <SelectItem value="50">50 per page</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead
                  key={column.accessorKey}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort(column.accessorKey)}
                >
                  <div className="flex items-center gap-2">
                    {column.header}
                    {sorting?.key === column.accessorKey && (
                      <span className="text-xs">
                        {sorting.direction === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.length > 0 ? (
              paginatedData.map((row, index) => (
                <TableRow
                  key={index}
                  className={onRowClick ? 'cursor-pointer hover:bg-muted/50' : ''}
                  onClick={() => onRowClick?.(row)}
                >
                  {columns.map((column) => (
                    <TableCell key={column.accessorKey}>
                      {column.cell
                        ? column.cell(row)
                        : getNestedValue(row, column.accessorKey) || '-'}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No results found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Showing {pagination.pageIndex * pagination.pageSize + 1} to{' '}
          {Math.min((pagination.pageIndex + 1) * pagination.pageSize, sortedData.length)} of{' '}
          {sortedData.length} results
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setPagination({ ...pagination, pageIndex: 0 })}
            disabled={pagination.pageIndex === 0}
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() =>
              setPagination({ ...pagination, pageIndex: pagination.pageIndex - 1 })
            }
            disabled={pagination.pageIndex === 0}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="text-sm font-medium">
            Page {pagination.pageIndex + 1} of {pageCount}
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() =>
              setPagination({ ...pagination, pageIndex: pagination.pageIndex + 1 })
            }
            disabled={pagination.pageIndex >= pageCount - 1}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setPagination({ ...pagination, pageIndex: pageCount - 1 })}
            disabled={pagination.pageIndex >= pageCount - 1}
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => current?.[key], obj)
}
