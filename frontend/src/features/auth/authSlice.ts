import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { AuthUser } from "../../types/auth";

interface AuthState {
  user: AuthUser | null;
  initialized: boolean;
}

const initialState: AuthState = {
  user: null,
  initialized: false
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setAuthenticatedUser(state, action: PayloadAction<AuthUser>) {
      state.user = action.payload;
      state.initialized = true;
    },
    clearAuthenticatedUser(state) {
      state.user = null;
      state.initialized = true;
    },
    setAuthInitialized(state) {
      state.initialized = true;
    }
  }
});

export const { setAuthenticatedUser, clearAuthenticatedUser, setAuthInitialized } = authSlice.actions;
export default authSlice.reducer;
