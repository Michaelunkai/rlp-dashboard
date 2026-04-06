import { useState, useRef, useEffect } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const STATUS_ORDER = ['pending', 'in_progress', 'done'];

function StatusBadge({ status }) {
  if (status === 'done') {
    return (
      <span className="flex items-center justify-center w-5 h-5 rounded-full bg-green-500/20 shrink-0">
        <svg className="w-3 h-3 text-green-400" viewBox="0 0 12 12" fill="none">
          <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    );
  }
  if (status === 'in_progress') {
    return (
      <span className="flex items-center justify-center w-5 h-5 shrink-0">
        <span className="w-2.5 h-2.5 rounded-full bg-blue-400 animate-pulse" />
      </span>
    );
  }
  // pending
  return (
    <span className="flex items-center justify-center w-5 h-5 shrink-0">
      <span className="w-2.5 h-2.5 rounded-full bg-gray-500" />
    </span>
  );
}

function DragHandle({ listeners, attributes }) {
  return (
    <span
      {...listeners}
      {...attributes}
      className="flex items-center justify-center w-5 h-5 text-gray-600 hover:text-gray-400 cursor-grab active:cursor-grabbing shrink-0 touch-none"
      title="Drag to reorder"
    >
      <svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor">
        <circle cx="5" cy="3.5" r="1.2" />
        <circle cx="11" cy="3.5" r="1.2" />
        <circle cx="5" cy="8" r="1.2" />
        <circle cx="11" cy="8" r="1.2" />
        <circle cx="5" cy="12.5" r="1.2" />
        <circle cx="11" cy="12.5" r="1.2" />
      </svg>
    </span>
  );
}

export default function TodoItem({ todo, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(todo.text);
  const [hovered, setHovered] = useState(false);
  const inputRef = useRef(null);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: todo.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 999 : undefined,
  };

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const commitEdit = () => {
    const trimmed = editText.trim();
    if (trimmed && trimmed !== todo.text) {
      onUpdate({ ...todo, text: trimmed });
    } else {
      setEditText(todo.text);
    }
    setEditing(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') commitEdit();
    if (e.key === 'Escape') {
      setEditText(todo.text);
      setEditing(false);
    }
  };

  const cycleStatus = (e) => {
    e.stopPropagation();
    const idx = STATUS_ORDER.indexOf(todo.status);
    const next = STATUS_ORDER[(idx + 1) % STATUS_ORDER.length];
    onUpdate({ ...todo, status: next });
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    onDelete(todo.id);
  };

  const statusLabel = {
    pending: 'Pending',
    in_progress: 'In Progress',
    done: 'Done',
  }[todo.status] || todo.status;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group flex items-center gap-2 px-3 py-2 rounded-lg border transition-all duration-150 select-none
        ${isDragging
          ? 'border-blue-500/50 bg-gray-800/80 shadow-lg shadow-blue-900/30'
          : 'border-gray-700/50 bg-gray-800/40 hover:bg-gray-800/70 hover:border-gray-600/60'
        }
        ${todo.status === 'done' ? 'opacity-60' : ''}
      `}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Drag handle */}
      <DragHandle listeners={listeners} attributes={attributes} />

      {/* Status badge */}
      <StatusBadge status={todo.status} />

      {/* ID */}
      <span className="text-xs text-gray-600 font-mono w-7 shrink-0 text-right">
        #{todo.id}
      </span>

      {/* Text / Edit input */}
      <div className="flex-1 min-w-0">
        {editing ? (
          <input
            ref={inputRef}
            type="text"
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            onBlur={commitEdit}
            onKeyDown={handleKeyDown}
            className="w-full bg-gray-900 border border-blue-500/60 rounded px-2 py-0.5 text-sm text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
          />
        ) : (
          <span
            title={todo.text}
            onDoubleClick={() => {
              setEditText(todo.text);
              setEditing(true);
            }}
            className={`block text-sm truncate cursor-text
              ${todo.status === 'done' ? 'line-through text-gray-500' : 'text-gray-200'}
            `}
          >
            {todo.text}
          </span>
        )}
      </div>

      {/* Hover actions */}
      <div className={`flex items-center gap-1 shrink-0 transition-opacity duration-100 ${hovered && !editing ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        {/* Status cycle button */}
        <button
          onClick={cycleStatus}
          title={`Status: ${statusLabel} — click to cycle`}
          className="px-1.5 py-0.5 rounded text-xs font-medium transition-colors
            text-gray-400 hover:text-gray-100 hover:bg-gray-700/60"
        >
          {statusLabel}
        </button>

        {/* Delete button */}
        <button
          onClick={handleDelete}
          title="Delete todo"
          className="flex items-center justify-center w-6 h-6 rounded transition-colors
            text-gray-600 hover:text-red-400 hover:bg-red-900/30"
        >
          <svg viewBox="0 0 16 16" width="12" height="12" fill="currentColor">
            <path d="M6.5 1h3a.5.5 0 0 1 .5.5v1H6v-1a.5.5 0 0 1 .5-.5zM11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3A1.5 1.5 0 0 0 5 1.5v1H2.5a.5.5 0 0 0 0 1H3v9a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-9h.5a.5.5 0 0 0 0-1H11zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM6.5 6a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0v-6a.5.5 0 0 1 .5-.5zm3 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0v-6a.5.5 0 0 1 .5-.5z" />
          </svg>
        </button>
      </div>
    </div>
  );
}
