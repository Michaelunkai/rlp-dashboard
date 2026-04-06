import { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import TodoItem from './TodoItem';

const FILTER_TABS = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'done', label: 'Done' },
];

const EMPTY_MESSAGES = {
  all: 'No todos yet.',
  pending: 'No pending todos.',
  in_progress: 'Nothing in progress.',
  done: 'No completed todos yet.',
};

const TodoList = ({ todos = [], onUpdate, onDelete, onReorder }) => {
  const [activeFilter, setActiveFilter] = useState('all');
  const [activeId, setActiveId] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const filteredTodos =
    activeFilter === 'all'
      ? todos
      : todos.filter((t) => t.status === activeFilter);

  const handleDragStart = ({ active }) => {
    setActiveId(active.id);
  };

  const handleDragEnd = ({ active, over }) => {
    setActiveId(null);
    if (!over || active.id === over.id) return;

    const oldIndex = todos.findIndex((t) => t.id === active.id);
    const newIndex = todos.findIndex((t) => t.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(todos, oldIndex, newIndex);
    if (onReorder) onReorder(reordered);
  };

  const activeTodo = activeId != null ? todos.find((t) => t.id === activeId) : null;

  const tabCounts = FILTER_TABS.reduce((acc, tab) => {
    acc[tab.key] =
      tab.key === 'all'
        ? todos.length
        : todos.filter((t) => t.status === tab.key).length;
    return acc;
  }, {});

  return (
    <div className="flex flex-col h-full">
      {/* Filter Tabs */}
      <div className="flex gap-1 mb-3 flex-shrink-0">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveFilter(tab.key)}
            className={[
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 select-none',
              activeFilter === tab.key
                ? 'bg-white/20 text-white shadow-inner ring-1 ring-white/20'
                : 'text-white/50 hover:text-white/80 hover:bg-white/10',
            ].join(' ')}
          >
            <span>{tab.label}</span>
            {tabCounts[tab.key] > 0 && (
              <span
                className={[
                  'inline-flex items-center justify-center rounded-full text-[10px] leading-none px-1.5 py-0.5 min-w-[18px]',
                  activeFilter === tab.key
                    ? 'bg-white/30 text-white'
                    : 'bg-white/10 text-white/60',
                ].join(' ')}
              >
                {tabCounts[tab.key]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Scrollable list */}
      <div
        className="flex-1 overflow-y-auto pr-1 min-h-0 space-y-2"
        style={{
          maxHeight: '420px',
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(255,255,255,0.15) transparent',
        }}
      >
        {filteredTodos.length === 0 ? (
          <div className="flex items-center justify-center py-10">
            <p className="text-white/30 text-sm italic">{EMPTY_MESSAGES[activeFilter]}</p>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={filteredTodos.map((t) => t.id)}
              strategy={verticalListSortingStrategy}
            >
              {filteredTodos.map((todo) => (
                <TodoItem
                  key={todo.id}
                  todo={todo}
                  onUpdate={onUpdate}
                  onDelete={onDelete}
                  isDragging={activeId === todo.id}
                />
              ))}
            </SortableContext>

            <DragOverlay>
              {activeTodo ? (
                <TodoItem
                  todo={activeTodo}
                  onUpdate={() => {}}
                  onDelete={() => {}}
                  isOverlay
                />
              ) : null}
            </DragOverlay>
          </DndContext>
        )}
      </div>

      {/* Custom scrollbar styles */}
      <style>{`
        .todo-list-scroll::-webkit-scrollbar {
          width: 4px;
        }
        .todo-list-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .todo-list-scroll::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.15);
          border-radius: 2px;
        }
        .todo-list-scroll::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.3);
        }
      `}</style>
    </div>
  );
};

export default TodoList;
