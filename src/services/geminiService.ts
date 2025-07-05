
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
      let errorMessage = `Error del servidor: ${response.status}.`;
      try {
          const errorData = await response.json();
          // Use the specific error message from the backend if available
          errorMessage = errorData.error || errorMessage;
      } catch (e) {
          // JSON parsing failed, stick with the original HTTP error.
          console.error("Could not parse error JSON from server", e);
      }
      throw new Error(errorMessage);
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
