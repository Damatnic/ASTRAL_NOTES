import React from 'react';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from '@/store/store';
import { ThemeProvider } from '@/contexts/ThemeContext';

export function renderWithProviders(ui: React.ReactElement, initialEntries: string[] = ['/']) {
  return render(
    <Provider store={store}>
      <ThemeProvider>
        <MemoryRouter initialEntries={initialEntries}>{ui}</MemoryRouter>
      </ThemeProvider>
    </Provider>
  );
}

export * from '@testing-library/react';
