import React, { createContext, useContext, useReducer, ReactNode } from "react";

// Define the state shape
interface AppState {
  user: null | { name: string; email: string };
  theme: "light" | "dark";
  loading: boolean;
}

// Define action types
type AppAction =
  | { type: "SET_USER"; payload: { name: string; email: string } | null }
  | { type: "SET_THEME"; payload: "light" | "dark" }
  | { type: "SET_LOADING"; payload: boolean };

// Initial state
const initialState: AppState = {
  user: null,
  theme: "light",
  loading: false,
};

// Reducer function
const appReducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    case "SET_USER":
      return { ...state, user: action.payload };
    case "SET_THEME":
      return { ...state, theme: action.payload };
    case "SET_LOADING":
      return { ...state, loading: action.payload };
    default:
      return state;
  }
};

// Context type
interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
}

// Create context
const AppContext = createContext<AppContextType | undefined>(undefined);

// Provider component
interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
};

// Custom hook to use the context
export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useAppContext must be used within an AppProvider");
  }
  return context;
};
