"use client";

import * as React from "react";
import {
    DndContext,
    type DragEndEvent,
    DragOverlay,
    PointerSensor,
    KeyboardSensor,
    closestCenter,
    useSensor,
    useSensors,
    useDroppable as useDndKitDroppable,
} from "@dnd-kit/core";
import {
    SortableContext,
    arrayMove,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

type DragDropContextValue = {
    activeId: string | null;
};

const DragDropContext = React.createContext<DragDropContextValue>({ activeId: null });

export type DragDropProviderProps = {
    items: string[];
    onReorder: (nextItems: string[]) => void;
    children: React.ReactNode;
    disabled?: boolean;
    renderOverlay?: (activeId: string) => React.ReactNode;
};

export function DragDropProvider({ items, onReorder, children, disabled, renderOverlay }: DragDropProviderProps) {
    const [activeId, setActiveId] = React.useState<string | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 6,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const onDragEnd = React.useCallback(
        (event: DragEndEvent) => {
            setActiveId(null);

            const active = event.active?.id;
            const over = event.over?.id;

            if (!active || !over) return;
            if (active === over) return;

            const oldIndex = items.indexOf(String(active));
            const newIndex = items.indexOf(String(over));

            if (oldIndex < 0 || newIndex < 0) return;

            onReorder(arrayMove(items, oldIndex, newIndex));
        },
        [items, onReorder]
    );

    return (
        <DragDropContext.Provider value={{ activeId }}>
            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={(event) => setActiveId(String(event.active.id))}
                onDragEnd={onDragEnd}
                onDragCancel={() => setActiveId(null)}
            >
                <SortableContext items={items} strategy={verticalListSortingStrategy}>
                    {children}
                </SortableContext>

                <DragOverlay>
                    {activeId && (renderOverlay ? renderOverlay(activeId) : null)}
                </DragOverlay>
            </DndContext>
        </DragDropContext.Provider>
    );
}

export type UseDraggableResult = {
    setNodeRef: (node: HTMLElement | null) => void;
    listeners: Record<string, any>;
    attributes: Record<string, any>;
    style: React.CSSProperties;
    isDragging: boolean;
    isSorting: boolean;
};

// Template-friendly API name: useDraggable
export function useDraggable(id: string, options?: { disabled?: boolean }): UseDraggableResult {
    const sortable = useSortable({ id, disabled: options?.disabled });

    return {
        setNodeRef: sortable.setNodeRef,
        listeners: (sortable.listeners ?? {}) as Record<string, any>,
        attributes: (sortable.attributes ?? {}) as Record<string, any>,
        style: {
            transform: CSS.Transform.toString(sortable.transform),
            transition: sortable.transition,
        },
        isDragging: sortable.isDragging,
        isSorting: sortable.isSorting,
    };
}

export type UseDroppableResult = {
    setNodeRef: (node: HTMLElement | null) => void;
    isOver: boolean;
};

// Template-friendly API name: useDroppable
export function useDroppable(id: string): UseDroppableResult {
    const droppable = useDndKitDroppable({ id });

    return {
        setNodeRef: droppable.setNodeRef,
        isOver: droppable.isOver,
    };
}

export function useActiveDragId() {
    return React.useContext(DragDropContext).activeId;
}
