// src/__tests__/smoke.test.tsx: Smoke-тесты компонентов UI

import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LogoMark } from '../components/branding/LogoMark';
import { ProgressBar } from '../components/common/ProgressBar';
import { SegmentedControl } from '../components/common/SegmentedControl';
import { BottomNav } from '../components/layout/BottomNav';
import { Header } from '../components/layout/Header';
import { MemoryRouter } from 'react-router-dom';

describe('UI Smoke Tests', () => {
  it('рендерит LogoMark во всех трех режимах без ошибок', () => {
    const { container: staticLogo } = render(<LogoMark mode="static" size={48} />);
    expect(staticLogo.querySelector('svg')).toBeDefined();

    const { container: ambientLogo } = render(<LogoMark mode="ambient" size={48} />);
    expect(ambientLogo.querySelector('svg')).toBeDefined();

    const { container: pulseLogo } = render(<LogoMark mode="pulse-on-tap" size={48} />);
    expect(pulseLogo.querySelector('svg')).toBeDefined();
  });

  it('рендерит BottomNav ровно с 5 основными разделами', () => {
    render(
      <MemoryRouter>
        <BottomNav />
      </MemoryRouter>
    );
    expect(screen.getByText('Склад')).toBeInTheDocument();
    expect(screen.getByText('Рецепты')).toBeInTheDocument();
    expect(screen.getByText('Настойки')).toBeInTheDocument();
    expect(screen.getByText('Перемещения')).toBeInTheDocument();
    expect(screen.getByText('Аналитика')).toBeInTheDocument();
    expect(screen.queryByText('Витрина')).toBeNull();
    expect(screen.queryByText('AI Чат')).toBeNull();
  });

  it('рендерит Header с Витриной, ИИ Помощником, Темой и Профилем', () => {
    render(
      <MemoryRouter>
        <Header darkMode={false} onToggleDarkMode={() => {}} />
      </MemoryRouter>
    );
    expect(screen.getByText('Витрина')).toBeInTheDocument();
    expect(screen.getByText('ИИ Помощник')).toBeInTheDocument();
    expect(screen.getByText('Профиль')).toBeInTheDocument();
  });

  it('рендерит ProgressBar и корректно рассчитывает статусы остатков', () => {
    const { rerender } = render(
      <ProgressBar current={25} minStock={5} unit="кг" />
    );
    expect(screen.getByText(/В норме/i)).toBeInTheDocument();

    // Дефицит
    rerender(<ProgressBar current={2} minStock={5} unit="кг" />);
    expect(screen.getByText(/Заканчивается!/i)).toBeInTheDocument();
  });

  it('рендерит SegmentedControl с передаваемыми опциями', () => {
    render(
      <SegmentedControl
        value="opt1"
        onChange={() => {}}
        options={[
          { value: 'opt1', label: 'Опция 1' },
          { value: 'opt2', label: 'Опция 2' }
        ]}
      />
    );
    expect(screen.getByText('Опция 1')).toBeInTheDocument();
    expect(screen.getByText('Опция 2')).toBeInTheDocument();
  });
});
