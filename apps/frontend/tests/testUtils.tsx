import type { ReactElement } from "react";
import { configureStore } from "@reduxjs/toolkit";
import { Provider } from "react-redux";
import { render } from "@testing-library/react";
import authReducer from "@/redux/authSlice";

export function renderWithStore(ui: ReactElement) {
  const store = configureStore({ reducer: { auth: authReducer } });
  return { store, ...render(<Provider store={store}>{ui}</Provider>) };
}
