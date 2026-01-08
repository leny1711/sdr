import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import MatchFeedback from '../components/MatchFeedback';

type MatchFeedbackContextValue = {
  showMatch: (name: string) => void;
  hideMatch: () => void;
};

type MatchFeedbackState = {
  visible: boolean;
  name: string;
  trigger: number;
};

const MatchFeedbackContext = createContext<MatchFeedbackContextValue | undefined>(undefined);

const sanitizeName = (name: string) => name.trim();

export const MatchFeedbackProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, setState] = useState<MatchFeedbackState>({
    visible: false,
    name: '',
    trigger: 0,
  });

  const hideMatch = useCallback(() => {
    setState((prev) => (prev.visible ? { ...prev, visible: false } : prev));
  }, []);

  const showMatch = useCallback((name: string) => {
    const safeName = sanitizeName(name);
    if (!safeName) return;

    setState({
      visible: true,
      name: safeName,
      trigger: Date.now(),
    });
  }, []);

  const value = useMemo(
    () => ({
      showMatch,
      hideMatch,
    }),
    [showMatch, hideMatch]
  );

  return (
    <MatchFeedbackContext.Provider value={value}>
      {children}
      <MatchFeedback
        visible={state.visible}
        name={state.name}
        onHide={hideMatch}
        trigger={state.trigger}
      />
    </MatchFeedbackContext.Provider>
  );
};

export const useMatchFeedback = () => {
  const context = useContext(MatchFeedbackContext);
  if (!context) {
    throw new Error('useMatchFeedback must be used within a MatchFeedbackProvider');
  }
  return context;
};
