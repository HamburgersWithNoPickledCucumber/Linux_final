import { useMemo } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useDashboard } from '../../context/DashboardContext';
import styles from './PluginGrid.module.css';

function SortablePlugin({ id, children }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {children}
    </div>
  );
}

export default function PluginGrid({ tab, children }) {
  const { getOrder, setOrder } = useDashboard();

  const childArray = useMemo(
    () => (Array.isArray(children) ? children.filter(Boolean) : children ? [children] : []),
    [children]
  );

  const savedOrder = getOrder(tab);
  const ids = useMemo(() => childArray.map((c) => c.key), [childArray]);

  const orderedChildren = useMemo(() => {
    if (!savedOrder) return childArray;
    const map = Object.fromEntries(childArray.map((c) => [c.key, c]));
    return savedOrder.filter((id) => map[id]).map((id) => map[id]);
  }, [childArray, savedOrder]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      const oldIndex = ids.indexOf(active.id);
      const newIndex = ids.indexOf(over.id);
      const newOrder = arrayMove(ids, oldIndex, newIndex);
      setOrder(tab, newOrder);
    }
  };

  if (childArray.length === 0) {
    return <div className={styles.emptyState}>No metrics available for this tab.</div>;
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={ids} strategy={rectSortingStrategy}>
        <div className={styles.grid}>
          {orderedChildren.map((child) => (
            <SortablePlugin key={child.key} id={child.key}>
              {child}
            </SortablePlugin>
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
