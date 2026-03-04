"use client";

import * as React from "react";
import { Resizable } from "react-resizable";
import "react-resizable/css/styles.css";

import { cn } from "@/lib/utils";

export type ResizableTableColumn<TData> = {
    key: string;
    header: React.ReactNode;
    cell: (row: TData) => React.ReactNode;

    width?: number;
    minWidth?: number;
    maxWidth?: number;

    headerClassName?: string;
    cellClassName?: string;
};

export type ResizableTablePagination = {
    page: number;
    pageSize: number;
    totalItems: number;
    onPageChange?: (page: number) => void;
};

export type ResizableTableRowSelection = {
    selectedRowIds?: string[];
    onSelectedRowIdsChange?: (ids: string[]) => void;
};

export type ResizableTableProps<TData> = {
    data: TData[];
    columns: Array<ResizableTableColumn<TData>>;
    getRowId: (row: TData) => string;

    className?: string;
    minTableWidth?: number;

    emptyState?: React.ReactNode;
    rowClassName?: (row: TData) => string;

    enableRowSelection?: boolean;
    rowSelection?: ResizableTableRowSelection;

    pagination?: ResizableTablePagination;
};

const DEFAULT_COL_WIDTH = 160;
const DEFAULT_MIN_COL_WIDTH = 80;
const DEFAULT_MAX_COL_WIDTH = 520;
const CHECKBOX_COL_KEY = "__checkbox__";

function clamp(value: number, min: number, max: number) {
    return Math.max(min, Math.min(max, value));
}

function getInitialWidths<TData>(
    columns: Array<ResizableTableColumn<TData>>,
    enableRowSelection: boolean
) {
    const widths: Record<string, number> = {};
    if (enableRowSelection) {
        widths[CHECKBOX_COL_KEY] = 50;
    }

    for (const col of columns) {
        widths[col.key] = col.width ?? DEFAULT_COL_WIDTH;
    }

    return widths;
}

export function ResizableTable<TData>(props: ResizableTableProps<TData>) {
    const {
        data,
        columns,
        getRowId,
        className,
        minTableWidth = 960,
        emptyState,
        rowClassName,
        enableRowSelection = false,
        rowSelection,
        pagination,
    } = props;

    const widthsSeed = React.useMemo(
        () => getInitialWidths(columns, enableRowSelection),
        // columns keys + selection flag are the stable seed
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [enableRowSelection, ...columns.map((c) => `${c.key}:${c.width ?? ""}`)]
    );

    const [columnWidths, setColumnWidths] = React.useState<Record<string, number>>(widthsSeed);

    React.useEffect(() => {
        // When columns set changes, merge previous widths with new defaults.
        setColumnWidths((prev) => ({
            ...widthsSeed,
            ...prev,
        }));
    }, [widthsSeed]);

    const isSelectionControlled = rowSelection?.selectedRowIds !== undefined;
    const [internalSelected, setInternalSelected] = React.useState<string[]>([]);
    const selectedRowIds = isSelectionControlled
        ? rowSelection?.selectedRowIds ?? []
        : internalSelected;

    const setSelectedRowIds = React.useCallback(
        (next: string[]) => {
            if (!isSelectionControlled) {
                setInternalSelected(next);
            }
            rowSelection?.onSelectedRowIdsChange?.(next);
        },
        [isSelectionControlled, rowSelection]
    );

    const isServerPagination = Boolean(pagination);
    const [internalPage, setInternalPage] = React.useState(1);
    const currentPage = isServerPagination ? pagination!.page : internalPage;
    const pageSize = isServerPagination ? pagination!.pageSize : 10;

    const totalItems = isServerPagination ? pagination!.totalItems : data.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

    const pageRows = React.useMemo(() => {
        if (isServerPagination) return data;
        const startIndex = (currentPage - 1) * pageSize;
        return data.slice(startIndex, startIndex + pageSize);
    }, [data, currentPage, isServerPagination, pageSize]);

    const pageRowIds = React.useMemo(() => pageRows.map(getRowId), [getRowId, pageRows]);
    const allSelectedOnPage =
        enableRowSelection &&
        pageRowIds.length > 0 &&
        pageRowIds.every((id) => selectedRowIds.includes(id));

    const toggleRowSelection = React.useCallback(
        (rowId: string) => {
            setSelectedRowIds(
                selectedRowIds.includes(rowId)
                    ? selectedRowIds.filter((id) => id !== rowId)
                    : [...selectedRowIds, rowId]
            );
        },
        [selectedRowIds, setSelectedRowIds]
    );

    const toggleSelectAllOnPage = React.useCallback(() => {
        if (allSelectedOnPage) {
            setSelectedRowIds(selectedRowIds.filter((id) => !pageRowIds.includes(id)));
            return;
        }

        const merged = new Set([...selectedRowIds, ...pageRowIds]);
        setSelectedRowIds(Array.from(merged));
    }, [allSelectedOnPage, pageRowIds, selectedRowIds, setSelectedRowIds]);

    const setPage = React.useCallback(
        (nextPage: number) => {
            const safePage = clamp(nextPage, 1, totalPages);
            if (isServerPagination) {
                pagination!.onPageChange?.(safePage);
            } else {
                setInternalPage(safePage);
            }
        },
        [isServerPagination, pagination, totalPages]
    );

    const handleResize = React.useCallback(
        (columnKey: string, width: number, minWidth?: number, maxWidth?: number) => {
            const nextWidth = clamp(
                width,
                minWidth ?? DEFAULT_MIN_COL_WIDTH,
                maxWidth ?? DEFAULT_MAX_COL_WIDTH
            );

            setColumnWidths((prev) => ({
                ...prev,
                [columnKey]: nextWidth,
            }));
        },
        []
    );

    const empty = data.length === 0;

    return (
        <div className={cn("w-full", className)}>
            <div className="bg-background border border-border/50 overflow-hidden rounded-lg relative">
                <div className="overflow-x-auto">
                    <div className="min-w-[960px]" style={{ minWidth: minTableWidth }}>
                        {/* Header */}
                        <div className="flex py-3 text-xs font-medium text-muted-foreground/70 bg-muted/5 border-b border-border">
                            {enableRowSelection && (
                                <div
                                    className="flex items-center justify-center border-r border-border pr-3"
                                    style={{ width: columnWidths[CHECKBOX_COL_KEY] ?? 50 }}
                                >
                                    <input
                                        type="checkbox"
                                        className="w-4 h-4 rounded border-border/40 cursor-pointer"
                                        checked={Boolean(allSelectedOnPage)}
                                        onChange={toggleSelectAllOnPage}
                                    />
                                </div>
                            )}

                            {columns.map((col) => {
                                const width = columnWidths[col.key] ?? col.width ?? DEFAULT_COL_WIDTH;
                                const minWidth = col.minWidth ?? DEFAULT_MIN_COL_WIDTH;
                                const maxWidth = col.maxWidth ?? DEFAULT_MAX_COL_WIDTH;

                                return (
                                    <Resizable
                                        key={col.key}
                                        width={width}
                                        height={0}
                                        onResize={(_e, data) =>
                                            handleResize(col.key, data.size.width, minWidth, maxWidth)
                                        }
                                        minConstraints={[minWidth, 0]}
                                        maxConstraints={[maxWidth, 0]}
                                        handle={
                                            <div className="absolute right-0 top-0 bottom-0 w-1 hover:w-1.5 cursor-col-resize bg-transparent hover:bg-primary/40 transition-all" />
                                        }
                                    >
                                        <div
                                            className={cn(
                                                "flex items-center border-r border-border px-3 relative select-none",
                                                col.headerClassName
                                            )}
                                            style={{ width }}
                                        >
                                            <span className="truncate">{col.header}</span>
                                        </div>
                                    </Resizable>
                                );
                            })}
                        </div>

                        {/* Body */}
                        {empty ? (
                            <div className="py-10 text-sm text-muted-foreground text-center">
                                {emptyState ?? "Нет данных"}
                            </div>
                        ) : (
                            <div>
                                {pageRows.map((row) => {
                                    const rowId = getRowId(row);
                                    const isSelected = enableRowSelection && selectedRowIds.includes(rowId);

                                    return (
                                        <div
                                            key={rowId}
                                            className={cn(
                                                "py-3.5 group relative transition-colors duration-150 border-b border-border flex",
                                                isSelected ? "bg-muted/30" : "bg-muted/5 hover:bg-muted/20",
                                                rowClassName?.(row)
                                            )}
                                        >
                                            {enableRowSelection && (
                                                <div
                                                    className="flex items-center justify-center border-r border-border pr-3"
                                                    style={{ width: columnWidths[CHECKBOX_COL_KEY] ?? 50 }}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        className="w-4 h-4 rounded border-border/40 cursor-pointer"
                                                        checked={isSelected}
                                                        onChange={() => toggleRowSelection(rowId)}
                                                    />
                                                </div>
                                            )}

                                            {columns.map((col, index) => {
                                                const width =
                                                    columnWidths[col.key] ?? col.width ?? DEFAULT_COL_WIDTH;

                                                return (
                                                    <div
                                                        key={`${rowId}:${col.key}`}
                                                        className={cn(
                                                            "flex items-center min-w-0",
                                                            index < columns.length - 1
                                                                ? "border-r border-border"
                                                                : null,
                                                            "px-3",
                                                            col.cellClassName
                                                        )}
                                                        style={{ width }}
                                                    >
                                                        <div className="min-w-0 w-full">
                                                            {col.cell(row)}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Pagination */}
            {pagination && totalPages > 1 && (
                <div className="mt-4 flex items-center justify-between px-2">
                    <div className="text-xs text-muted-foreground/70">
                        Страница {currentPage} из {totalPages} • {totalItems}
                    </div>

                    <div className="flex gap-1.5">
                        <button
                            onClick={() => setPage(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="px-3 py-1.5 bg-background border border-border/50 text-foreground text-xs hover:bg-muted/30 disabled:opacity-40 disabled:cursor-not-allowed transition-colors rounded-md"
                        >
                            Назад
                        </button>
                        <button
                            onClick={() => setPage(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className="px-3 py-1.5 bg-background border border-border/50 text-foreground text-xs hover:bg-muted/30 disabled:opacity-40 disabled:cursor-not-allowed transition-colors rounded-md"
                        >
                            Вперед
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
