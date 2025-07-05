import { BillItem } from '../types';

export const extractItemsFromReceipt = async (base64Image: string): Promise<BillItem[]> => {
  const response = await fetch('/api/scan', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ base64Image }),
  });

  if (!response.ok) {
      // Try to parse the error from the backend, but provide a fallback.
      const errorData = await response.json().catch(() => ({ 
          error: `Error del servidor: ${response.status} ${response.statusText}` 
      }));
      throw new Error(errorData.error || `Error del servidor: ${response.statusText}`);
  }

  const parsedData: { name: string; quantity: number; price: number }[] = await response.json();
  
  if (Array.isArray(parsedData)) {
    return parsedData
      .filter(item => item.name && typeof item.price === 'number' && item.price > 0)
      .flatMap(item => {
        const quantity = item.quantity && typeof item.quantity === 'number' && item.quantity > 0 ? item.quantity : 1;
        
        if (quantity <= 1) {
          return [{
            id: crypto.randomUUID(),
            name: item.name,
            price: item.price,
            assignedTo: [],
          }];
        } else {
          const singleItemPrice = item.price / quantity;
          return Array.from({ length: quantity }, (_, i) => ({
            id: crypto.randomUUID(),
            name: `${item.name} (${i + 1}/${quantity})`,
            price: singleItemPrice,
            assignedTo: [],
          }));
        }
      });
  }
  return [];
};