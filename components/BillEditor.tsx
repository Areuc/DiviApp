import React, { useState } from 'react';
import { BillItem, Participant } from '../types';
import { TrashIcon, PlusIcon, ArrowLeftIcon, UserIcon, UsersIcon } from './common/Icons';
import { DndContext, useDraggable, useDroppable, DragEndEvent } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';

interface BillEditorProps {
  initialItems: BillItem[];
  initialParticipants: Participant[];
  onFinalize: (items: BillItem[], participants: Participant[]) => void;
  onBack: () => void;
}

const ItemCard: React.FC<{ item: BillItem }> = ({ item }) => {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
      id: item.id,
    });

    const style = {
        transform: CSS.Translate.toString(transform),
        transition: isDragging ? 'none' : 'transform 0.2s ease-in-out',
    };
    
    const draggingClasses = isDragging ? "shadow-neon-primary scale-105 opacity-80 z-10" : "cursor-grab";

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...listeners}
            {...attributes}
            className={`p-3 mb-2 bg-subtle-light dark:bg-subtle-dark rounded-lg shadow-sm flex justify-between items-center transition-all duration-200 ${draggingClasses}`}
        >
            <span className="font-medium text-text-primary-light dark:text-text-primary-dark flex items-center">
                {item.name}
            </span>
            <span className="font-bold text-primary-light dark:text-primary-dark">${item.price.toFixed(2)}</span>
        </div>
    );
};

interface ParticipantDropzoneProps {
  participant: Participant;
  assignedItems: BillItem[];
  onRemoveAssignment: (itemId: string, participantId: string) => void;
  onRemoveParticipant: (id: string) => void;
  wasJustDroppedOn: boolean;
}

const ParticipantDropzone: React.FC<ParticipantDropzoneProps> = ({ 
    participant, 
    assignedItems, 
    onRemoveAssignment, 
    onRemoveParticipant,
    wasJustDroppedOn
 }) => {
  const { isOver, setNodeRef } = useDroppable({
    id: participant.id,
  });

  const baseClasses = "bg-surface-light dark:bg-surface-dark p-4 rounded-xl shadow-md min-h-[150px] flex flex-col transition-all duration-200";
  const dragOverClasses = isOver ? "scale-105 ring-2 ring-offset-2 ring-secondary-light dark:ring-secondary-dark bg-secondary-light/10 dark:bg-secondary-dark/20" : "";
  const droppedClasses = wasJustDroppedOn ? "animate-glow" : "";

  return (
    <div
      ref={setNodeRef}
      className={`${baseClasses} ${dragOverClasses} ${droppedClasses}`}
    >
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-bold text-lg text-text-primary-light dark:text-text-primary-dark flex items-center"><UserIcon className="w-5 h-5 mr-2"/>{participant.name}</h3>
        <button onClick={() => onRemoveParticipant(participant.id)} className="text-red-500 hover:text-red-700">
            <TrashIcon className="w-5 h-5"/>
        </button>
      </div>
      <div className="flex-grow bg-subtle-light/50 dark:bg-background-dark/50 rounded-lg p-2">
         {assignedItems.length === 0 && <p className="text-center text-sm text-text-secondary-light dark:text-text-secondary-dark mt-4">Arrastra artículos aquí</p>}
        {assignedItems.map(item => (
          <div key={item.id} className="text-sm p-2 mb-1 bg-background-light dark:bg-border-dark rounded flex justify-between items-center">
            <span className="truncate pr-2">
                {item.name}
            </span>
            <div className="flex items-center flex-shrink-0">
              <span className="font-semibold mr-2">${(item.price / item.assignedTo.length).toFixed(2)}</span>
              <button onClick={() => onRemoveAssignment(item.id, participant.id)} className="text-text-secondary-dark hover:text-primary-dark">
                <TrashIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};


export const BillEditor: React.FC<BillEditorProps> = ({ initialItems, initialParticipants, onFinalize, onBack }) => {
  const [items, setItems] = useState<BillItem[]>(initialItems);
  const [participants, setParticipants] = useState<Participant[]>(initialParticipants);
  const [newParticipantName, setNewParticipantName] = useState('');
  const [justDroppedOnParticipant, setJustDroppedOnParticipant] = useState<string | null>(null);

  const handleAddItem = () => {
    setItems([...items, { id: crypto.randomUUID(), name: 'Artículo nuevo', price: 0, assignedTo: [] }]);
  };

  const handleItemChange = (index: number, field: keyof BillItem, value: string | number) => {
    const newItems = [...items];
    (newItems[index] as any)[field] = value;
    setItems(newItems);
  };
  
  const handleRemoveItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };
  
  const handleAddParticipant = (e: React.FormEvent) => {
    e.preventDefault();
    if (newParticipantName.trim()) {
      setParticipants([...participants, { id: crypto.randomUUID(), name: newParticipantName.trim() }]);
      setNewParticipantName('');
    }
  };

  const handleRemoveParticipant = (id: string) => {
    setParticipants(participants.filter(p => p.id !== id));
    // Also remove assignments
    setItems(items.map(item => ({...item, assignedTo: item.assignedTo.filter(pId => pId !== id) })));
  };

  const handleQuickSplit = () => {
    if (participants.length === 0) {
        alert("Añade participantes primero para poder repartir la cuenta.");
        return;
    }
    const isConfirmed = window.confirm("Esto asignará todos los artículos a todos los participantes por igual, reemplazando las asignaciones actuales. ¿Estás seguro?");
    if (isConfirmed) {
        const allParticipantIds = participants.map(p => p.id);
        const newItems = items.map(item => ({
            ...item,
            assignedTo: [...allParticipantIds]
        }));
        setItems(newItems);
    }
  };
  
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id) {
        const itemId = active.id as string;
        const participantId = over.id as string;

        if (participants.some(p => p.id === participantId)) {
            setItems(prevItems => prevItems.map(item => {
                if (item.id === itemId && !item.assignedTo.includes(participantId)) {
                    return { ...item, assignedTo: [...item.assignedTo, participantId] };
                }
                return item;
            }));

            setJustDroppedOnParticipant(participantId);
            setTimeout(() => {
                setJustDroppedOnParticipant(null);
            }, 500); // Duration of the glow animation
        }
    }
  };

  const removeAssignment = (itemId: string, participantId: string) => {
    setItems(prevItems => prevItems.map(item => {
        if(item.id === itemId){
            return {...item, assignedTo: item.assignedTo.filter(pId => pId !== participantId)}
        }
        return item;
    }));
  }

  const unassignedItems = items.filter(item => item.assignedTo.length === 0);

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div className="space-y-6">
        <button onClick={onBack} className="flex items-center text-sm text-primary-light dark:text-primary-dark hover:underline mb-4">
          <ArrowLeftIcon className="w-4 h-4 mr-1" />
          Volver a escanear
        </button>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1 bg-surface-light dark:bg-surface-dark p-4 rounded-xl shadow-md flex flex-col">
              <div className="mb-4 pb-4 border-b border-border-light dark:border-border-dark">
                  <h3 className="font-semibold mb-2 text-xl">Editar todos los artículos</h3>
                  <div className="max-h-60 overflow-y-auto space-y-2 pr-2">
                  {items.map((item, index) => (
                      <div key={item.id} className="grid grid-cols-[1fr_auto_auto] items-center gap-2">
                          <input type="text" value={item.name} onChange={e => handleItemChange(index, 'name', e.target.value)} className="p-1 border rounded bg-subtle-light dark:bg-background-dark border-border-light dark:border-border-dark" placeholder="Nombre del artículo"/>
                          <input type="number" min="0" step="0.01" value={item.price} onChange={e => handleItemChange(index, 'price', parseFloat(e.target.value) || 0)} className="w-20 p-1 border rounded bg-subtle-light dark:bg-background-dark border-border-light dark:border-border-dark" placeholder="Precio"/>
                          <button onClick={() => handleRemoveItem(item.id)} className="text-red-500 hover:text-red-700"><TrashIcon className="w-5 h-5"/></button>
                      </div>
                  ))}
                  </div>
                  <button onClick={handleAddItem} className="mt-2 w-full flex items-center justify-center p-2 text-sm bg-secondary-light text-background-dark font-semibold rounded-lg hover:bg-secondary-light/90 dark:bg-secondary-dark dark:hover:bg-secondary-dark/90">
                      <PlusIcon className="w-4 h-4 mr-1"/> Añadir artículo
                  </button>
              </div>
              
              <h2 className="text-xl font-bold mb-4">Artículos no asignados</h2>
              <div className="flex-grow overflow-y-auto pr-2">
                  {unassignedItems.map(item => <ItemCard key={item.id} item={item} />)}
                  {unassignedItems.length === 0 && <p className="text-center text-sm text-text-secondary-light dark:text-text-secondary-dark mt-4">¡Todos los artículos asignados!</p>}
              </div>
          </div>

          <div className="md:col-span-2">
            <div className="bg-surface-light dark:bg-surface-dark p-4 rounded-xl shadow-md mb-6">
              <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold">Participantes</h2>
                  <button
                      onClick={handleQuickSplit}
                      disabled={participants.length === 0 || items.length === 0}
                      className="flex items-center gap-2 px-3 py-1.5 text-sm bg-secondary-light text-background-dark font-semibold rounded-lg shadow-sm hover:bg-secondary-light/90 disabled:bg-border-dark disabled:text-text-secondary-dark disabled:cursor-not-allowed transition-colors"
                      title="Repartir todos los artículos por igual entre todos los participantes"
                  >
                      <UsersIcon className="w-4 h-4" />
                      Reparto Rápido
                  </button>
              </div>
              <form onSubmit={handleAddParticipant} className="flex gap-2">
                <input
                  type="text"
                  value={newParticipantName}
                  onChange={e => setNewParticipantName(e.target.value)}
                  placeholder="Introduce el nombre del participante"
                  className="flex-grow p-2 border rounded-lg bg-subtle-light dark:bg-background-dark border-border-light dark:border-border-dark"
                />
                <button type="submit" className="px-4 py-2 bg-primary-light text-white rounded-lg hover:bg-primary-light/90 dark:bg-primary-dark dark:hover:bg-primary-dark/90">
                  <PlusIcon className="w-6 h-6"/>
                </button>
              </form>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {participants.map(p => (
                <ParticipantDropzone
                  key={p.id}
                  participant={p}
                  assignedItems={items.filter(item => item.assignedTo.includes(p.id))}
                  onRemoveAssignment={removeAssignment}
                  onRemoveParticipant={handleRemoveParticipant}
                  wasJustDroppedOn={justDroppedOnParticipant === p.id}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-end">
          <button
            onClick={() => onFinalize(items, participants)}
            disabled={participants.length === 0}
            className="px-8 py-3 bg-secondary-light text-background-dark font-bold rounded-lg shadow-lg hover:bg-secondary-light/90 transition-colors disabled:bg-border-dark disabled:text-text-secondary-dark disabled:cursor-not-allowed"
          >
            Calcular totales
          </button>
        </div>
      </div>
    </DndContext>
  );
};