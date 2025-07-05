
import React, { useState, useEffect, useCallback } from 'react';
import { ReceiptScanner } from './components/ReceiptScanner';
import { BillEditor } from './components/BillEditor';
import { Summary } from './components/Summary';
import { Header } from './components/Header';
import { AppState, BillItem, Participant } from './types';
import { extractItemsFromReceipt } from './services/geminiService';
import { Spinner } from './components/common/Spinner';

const App: React.FC = () => {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [appState, setAppState] = useState<AppState>(AppState.UPLOADING);
  const [items, setItems] = useState<BillItem[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [tipPercentage, setTipPercentage] = useState<number>(10);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  const handleImageScan = async (imageData: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const extractedItems = await extractItemsFromReceipt(imageData);
      setItems(extractedItems);
      setAppState(AppState.EDITING);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ocurrió un error desconocido.';
      setError(errorMessage);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartOver = useCallback(() => {
    setItems([]);
    setParticipants([]);
    setError(null);
    setTipPercentage(10);
    setAppState(AppState.UPLOADING);
  }, []);

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center h-full pt-20">
          <Spinner />
          <p className="mt-4 text-text-secondary-light dark:text-text-secondary-dark">La IA está leyendo el recibo...</p>
        </div>
      );
    }

    if (error) {
       return (
        <div className="flex flex-col items-center justify-center h-full pt-10 text-center">
          <p className="text-red-500 font-semibold">{error}</p>
          <button
            onClick={handleStartOver}
            className="mt-4 px-6 py-2 bg-primary-light text-white rounded-lg shadow-md hover:bg-primary-light/90 dark:bg-primary-dark dark:hover:bg-primary-dark/90 transition-colors"
          >
            Intentar de nuevo
          </button>
        </div>
      );
    }
    
    switch (appState) {
      case AppState.UPLOADING:
        return <ReceiptScanner onScan={handleImageScan} onManualEntry={() => setAppState(AppState.EDITING)} />;
      case AppState.EDITING:
        return (
          <BillEditor
            initialItems={items}
            initialParticipants={participants}
            onFinalize={(finalItems, finalParticipants) => {
              setItems(finalItems);
              setParticipants(finalParticipants);
              setAppState(AppState.SUMMARY);
            }}
            onBack={handleStartOver}
          />
        );
      case AppState.SUMMARY:
        return (
          <Summary
            items={items}
            participants={participants}
            tipPercentage={tipPercentage}
            onTipChange={setTipPercentage}
            onBack={() => setAppState(AppState.EDITING)}
          />
        );
      default:
        return <ReceiptScanner onScan={handleImageScan} onManualEntry={() => setAppState(AppState.EDITING)} />;
    }
  };

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark text-text-primary-light dark:text-text-primary-dark font-sans transition-colors duration-300">
      <Header theme={theme} toggleTheme={toggleTheme} />
      <main className="container mx-auto p-4 max-w-4xl">
        {renderContent()}
      </main>
    </div>
  );
};

export default App;