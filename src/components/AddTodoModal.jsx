import { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

/**
 * AddTodoModal — modal dialog to add a new todo item.
 *
 * Props:
 *   isOpen    {boolean}   — controls visibility
 *   onClose   {function}  — called when modal is dismissed
 *   onAdd     {function}  — called with { text, mission, position, afterId }
 *   missions  {string[]}  — list of mission names from state.missionExplanations keys
 *   maxId     {number}    — highest existing todo ID (for "After ID" validation)
 */
const AddTodoModal = ({ isOpen, onClose, onAdd, missions = [], maxId = 0 }) => {
  const [text, setText] = useState('');
  const [selectedMission, setSelectedMission] = useState(missions[0] || '');
  const [position, setPosition] = useState('bottom'); // 'top' | 'bottom' | 'after'
  const [afterId, setAfterId] = useState('');
  const [error, setError] = useState('');

  const textareaRef = useRef(null);
  const overlayRef = useRef(null);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setText('');
      setSelectedMission(missions[0] || '');
      setPosition('bottom');
      setAfterId('');
      setError('');
      // Auto-focus textarea after animation settles
      setTimeout(() => textareaRef.current?.focus(), 120);
    }
  }, [isOpen, missions]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  // Auto-grow textarea
  const handleTextChange = (e) => {
    setText(e.target.value);
    const ta = e.target;
    ta.style.height = 'auto';
    ta.style.height = `${ta.scrollHeight}px`;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!text.trim()) {
      setError('Todo text is required.');
      textareaRef.current?.focus();
      return;
    }

    if (position === 'after') {
      const id = parseInt(afterId, 10);
      if (isNaN(id) || id < 1 || id > maxId) {
        setError(`After ID must be a number between 1 and ${maxId}.`);
        return;
      }
      onAdd({ text: text.trim(), mission: selectedMission, position: 'after', afterId: id });
    } else {
      onAdd({ text: text.trim(), mission: selectedMission, position, afterId: null });
    }

    onClose();
  };

  // Click outside overlay to close
  const handleOverlayClick = (e) => {
    if (e.target === overlayRef.current) onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={overlayRef}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backdropFilter: 'blur(6px)', backgroundColor: 'rgba(0,0,0,0.6)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onClick={handleOverlayClick}
        >
          <motion.div
            className="relative w-full max-w-lg rounded-2xl border border-white/10 bg-gray-900 shadow-2xl overflow-hidden"
            initial={{ opacity: 0, scale: 0.92, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 16 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
              <h2 className="text-lg font-semibold text-white tracking-tight">Add New Todo</h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-white transition-colors text-xl leading-none"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="px-6 py-5 flex flex-col gap-5">

              {/* Mission selector */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Mission
                </label>
                <select
                  value={selectedMission}
                  onChange={(e) => setSelectedMission(e.target.value)}
                  className="w-full rounded-lg bg-gray-800 border border-white/10 text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                >
                  {missions.length === 0 && (
                    <option value="">— No missions —</option>
                  )}
                  {missions.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              {/* Todo text */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Todo Text
                </label>
                <textarea
                  ref={textareaRef}
                  value={text}
                  onChange={handleTextChange}
                  placeholder="Describe the todo…"
                  rows={3}
                  className="w-full rounded-lg bg-gray-800 border border-white/10 text-white px-3 py-2 text-sm resize-none overflow-hidden focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors placeholder-gray-600"
                  style={{ minHeight: '72px' }}
                />
              </div>

              {/* Insert position */}
              <div className="flex flex-col gap-2">
                <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Insert Position
                </span>
                <div className="flex flex-col gap-2">
                  {[
                    { value: 'top', label: 'Top — insert before all existing todos' },
                    { value: 'bottom', label: 'Bottom — append after all existing todos' },
                    { value: 'after', label: 'After specific ID' },
                  ].map(({ value, label }) => (
                    <label
                      key={value}
                      className="flex items-center gap-3 cursor-pointer group"
                    >
                      <input
                        type="radio"
                        name="position"
                        value={value}
                        checked={position === value}
                        onChange={() => setPosition(value)}
                        className="accent-indigo-500 w-4 h-4 flex-shrink-0"
                      />
                      <span className="text-sm text-gray-300 group-hover:text-white transition-colors">
                        {label}
                      </span>
                    </label>
                  ))}
                </div>

                {/* After-ID sub-input */}
                <AnimatePresence>
                  {position === 'after' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.15 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-1 flex items-center gap-3">
                        <label className="text-sm text-gray-400 whitespace-nowrap">
                          After todo #
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={maxId}
                          value={afterId}
                          onChange={(e) => setAfterId(e.target.value)}
                          placeholder={`1 – ${maxId}`}
                          className="w-32 rounded-lg bg-gray-800 border border-white/10 text-white px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors placeholder-gray-600"
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Error message */}
              <AnimatePresence>
                {error && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.15 }}
                    className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2"
                  >
                    {error}
                  </motion.p>
                )}
              </AnimatePresence>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-1">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-white/5 border border-white/10 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-400"
                >
                  Add Todo
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AddTodoModal;
