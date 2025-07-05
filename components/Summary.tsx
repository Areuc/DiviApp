import React, { useMemo, useState } from 'react';
import { BillItem, Participant } from '../types';
import { ArrowLeftIcon, UserIcon, ChevronDownIcon } from './common/Icons';

interface SummaryProps {
  items: BillItem[];
  participants: Participant[];
  tipPercentage: number;
  onTipChange: (tip: number) => void;
  onBack: () => void;
}

const ParticipantSummaryCard: React.FC<{
    person: any; // from totals.finalTotals
    items: BillItem[];
}> = ({ person, items }) => {
    const [isOpen, setIsOpen] = useState(false);
    const personItems = items.filter(item => item.assignedTo.includes(person.id));

    return (
        <div className="bg-subtle-light dark:bg-subtle-dark rounded-lg transition-shadow hover:shadow-md">
            <div className="p-4 flex justify-between items-center cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
                <h3 className="text-lg font-semibold flex items-center">
                    <UserIcon className="w-5 h-5 mr-2"/>
                    {person.name}
                </h3>
                <div className="flex items-center">
                    <span className="text-2xl font-bold text-primary-light dark:text-primary-dark mr-2">${person.total.toFixed(2)}</span>
                    <ChevronDownIcon className={`w-5 h-5 text-gray-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                </div>
            </div>
            {isOpen && (
                 <div className="px-4 pb-4">
                    <div className="pt-3 border-t border-border-light dark:border-border-dark">
                        <div className="text-sm text-text-secondary-light dark:text-text-secondary-dark space-y-2">
                            {personItems.length > 0 && <h4 className="font-semibold text-text-primary-light dark:text-text-primary-dark mb-1">Artículos consumidos:</h4>}
                            {personItems.map(item => (
                                <div key={item.id} className="flex justify-between">
                                    <span className="truncate pr-2">
                                        {item.name}
                                        {item.assignedTo.length > 1 && <span className="text-xs"> (dividido)</span>}
                                    </span>
                                    <span>${(item.price / item.assignedTo.length).toFixed(2)}</span>
                                </div>
                            ))}
                            <div className="flex justify-between pt-2 border-t border-border-light/80 dark:border-border-dark/80">
                                <strong className="text-text-primary-light dark:text-text-primary-dark">Subtotal</strong>
                                <strong className="text-text-primary-light dark:text-text-primary-dark">${person.subtotal.toFixed(2)}</strong>
                            </div>
                            <div className="flex justify-between">
                                <span>Propina</span>
                                <span>${person.tip.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                 </div>
            )}
        </div>
    )
}


export const Summary: React.FC<SummaryProps> = ({ items, participants, tipPercentage, onTipChange, onBack }) => {
  const totals = useMemo(() => {
    const participantTotals: { [key: string]: number } = {};
    participants.forEach(p => (participantTotals[p.id] = 0));

    items.forEach(item => {
      if (item.assignedTo.length > 0) {
        const costPerPerson = item.price / item.assignedTo.length;
        item.assignedTo.forEach(participantId => {
          if (participantTotals[participantId] !== undefined) {
            participantTotals[participantId] += costPerPerson;
          }
        });
      }
    });
    
    const subtotal = Object.values(participantTotals).reduce((sum, val) => sum + val, 0);
    const tipAmount = subtotal * (tipPercentage / 100);
    const grandTotal = subtotal + tipAmount;

    const finalTotals = participants.map(p => {
        const personSubtotal = participantTotals[p.id];
        const personTip = subtotal > 0 ? (personSubtotal / subtotal) * tipAmount : 0;
        const personTotal = personSubtotal + personTip;
        return {
            ...p,
            subtotal: personSubtotal,
            tip: personTip,
            total: personTotal
        }
    }).sort((a, b) => a.name.localeCompare(b.name));

    return { finalTotals, subtotal, tipAmount, grandTotal };
  }, [items, participants, tipPercentage]);

  return (
    <div className="bg-surface-light dark:bg-surface-dark p-6 rounded-xl shadow-lg">
      <button onClick={onBack} className="flex items-center text-sm text-primary-light dark:text-primary-dark hover:underline mb-6">
        <ArrowLeftIcon className="w-4 h-4 mr-1" />
        Volver al editor
      </button>

      <h2 className="text-3xl font-bold text-center mb-6">Resumen de pago</h2>

      <div className="space-y-4 mb-8">
        {totals.finalTotals.map(p => (
          <ParticipantSummaryCard key={p.id} person={p} items={items} />
        ))}
      </div>
      
      <div className="border-t-2 border-dashed border-border-light dark:border-border-dark pt-6">
        <div className="mb-4">
            <label htmlFor="tip" className="block text-lg font-medium mb-2 text-center">Porcentaje de propina</label>
            <div className="flex items-center justify-center gap-2">
                <input 
                    id="tip" 
                    type="range" 
                    min="0" 
                    max="30" 
                    value={tipPercentage} 
                    onChange={e => onTipChange(parseInt(e.target.value, 10))}
                    className="w-1/2"
                />
                <span className="font-bold text-lg w-16 text-center">{tipPercentage}%</span>
            </div>
             <div className="flex justify-center gap-2 mt-2">
                {[0, 10, 15, 20].map(p => (
                    <button key={p} onClick={() => onTipChange(p)} className={`px-3 py-1 text-sm rounded-full ${tipPercentage === p ? 'bg-primary-light text-white dark:bg-primary-dark' : 'bg-subtle-light dark:bg-border-dark'}`}>
                        {p}%
                    </button>
                ))}
            </div>
        </div>

        <div className="space-y-2 text-lg">
             <div className="flex justify-between font-medium">
                <span>Total cuenta (Subtotal):</span>
                <span>${totals.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-medium">
                <span>Propina total:</span>
                <span>${totals.tipAmount.toFixed(2)}</span>
            </div>
             <div className="flex justify-between font-bold text-2xl text-secondary-light dark:text-secondary-dark pt-2 border-t border-border-light dark:border-border-dark">
                <span>Total general:</span>
                <span>${totals.grandTotal.toFixed(2)}</span>
            </div>
        </div>
      </div>
    </div>
  );
};