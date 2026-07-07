import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export type Theme = "light" | "dark";

export const THEME_STORAGE_KEY = "zylora.theme";

function getInitialTheme(): Theme {
  return window.localStorage.getItem(THEME_STORAGE_KEY) === "dark" ? "dark" : "light";
}

const themeSlice = createSlice({
  name: "theme",
  initialState: { value: getInitialTheme() },
  reducers: {
    setTheme(state, action: PayloadAction<Theme>) {
      state.value = action.payload;
    }
  }
});

export const { setTheme } = themeSlice.actions;
export default themeSlice.reducer;
