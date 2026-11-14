// src/App.tsx: Корневой компонент приложения с HashRouter

import React, { useState, useEffect } from 'react';
import {
  createHashRouter,
  RouterProvider,
  Outlet,
  Navigate,
  useNavigate
} from 'react-router-dom';
import { Header } from './components/layout/Header';
import { BottomNav } from './components/layout/BottomNav';
import { SplashScreen } from './components/branding/SplashScreen';
import { dataService } from './db/dataService';
import { Venue, Profile } from './types';

import { InventoryPage } from './pages/InventoryPage';
import { RecipesPage } from './pages/RecipesPage';
import { BatchesPage } from './pages/BatchesPage';
import { TransfersPage } from './pages/TransfersPage';
import { TeamPage } from './pages/TeamPage';
import { AssistantPage } from './pages/AssistantPage';
import { StatisticsPage } from './pages/StatisticsPage';
import { ShowcasePage } from './pages/ShowcasePage';
import { AuthPage } from './pages/AuthPage';

export function RootLayout({
  venues,
  activeVenueId,
  onVenueChange,
  currentProfile,
  darkMode,
  onToggleDarkMode,
  isMock
}: {
  venues: Venue[];
  activeVenueId: string;
  onVenueChange: (id: string) => void;
  currentProfile: Profile;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  isMock: boolean;
}) {
  return (
    <div className={`min-h-screen pb-[calc(76px+env(safe-area-inset-bottom,16px))] ${darkMode ? 'dark' : ''}`}>
      <Header
        venues={venues}
        activeVenueId={activeVenueId}
        onVenueChange={onVenueChange}
        currentProfile={currentProfile}
        darkMode={darkMode}
        onToggleDarkMode={onToggleDarkMode}
        isMock={isMock}
      />
      <main className="max-w-4xl mx-auto">
        <Outlet />
      </main>
      <BottomNav userRole={currentProfile.role} />
    </div>
  );
}

export function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [activeVenueId, setActiveVenueId] = useState<string>('production-podvorie');
  const [currentProfile, setCurrentProfile] = useState<Profile>(dataService.getCurrentProfile());

  useEffect(() => {
    dataService.getVenues().then(vList => {
      setVenues(vList);
      if (currentProfile.venue_id) {
        setActiveVenueId(currentProfile.venue_id);
      } else if (vList.length > 0) {
        setActiveVenueId(vList[0].id);
      }
    });
  }, [currentProfile]);

  const toggleDarkMode = () => {
    setDarkMode(prev => {
      const next = !prev;
      if (next) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      return next;
    });
  };

  const handleVenueChange = (venueId: string) => {
    setActiveVenueId(venueId);
  };

  const handleLoginSuccess = (profile: Profile) => {
    setCurrentProfile(profile);
    if (profile.venue_id) {
      setActiveVenueId(profile.venue_id);
    }
  };

  // Роутинг на базе createHashRouter для 100% совместимости с GitHub Pages
  const router = createHashRouter([
    {
      path: '/login',
      element: <AuthPage onLoginSuccess={handleLoginSuccess} />
    },
    {
      path: '/invite/:token',
      element: <AuthPage onLoginSuccess={handleLoginSuccess} />
    },
    {
      path: '/',
      element: (
        <RootLayout
          venues={venues}
          activeVenueId={activeVenueId}
          onVenueChange={handleVenueChange}
          currentProfile={currentProfile}
          darkMode={darkMode}
          onToggleDarkMode={toggleDarkMode}
          isMock={dataService.isMockMode()}
        />
      ),
      children: [
        {
          index: true,
          element: (
            <InventoryPage
              activeVenueId={activeVenueId}
              venues={venues}
              currentProfile={currentProfile}
            />
          )
        },
        {
          path: 'showcase',
          element: <ShowcasePage />
        },
        {
          path: 'recipes',
          element: (
            <RecipesPage
              activeVenueId={activeVenueId}
              venues={venues}
              currentProfile={currentProfile}
            />
          )
        },
        {
          path: 'batches',
          element: (
            <BatchesPage
              activeVenueId={activeVenueId}
              venues={venues}
              currentProfile={currentProfile}
            />
          )
        },
        {
          path: 'transfers',
          element: (
            <TransfersPage
              venues={venues}
              currentProfile={currentProfile}
            />
          )
        },
        {
          path: 'statistics',
          element: (
            <StatisticsPage
              venues={venues}
              currentProfile={currentProfile}
            />
          )
        },
        {
          path: 'team',
          element: currentProfile.role === 'owner' ? (
            <TeamPage
              venues={venues}
              currentProfile={currentProfile}
            />
          ) : (
            <Navigate to="/" replace />
          )
        },
        {
          path: 'assistant',
          element: (
            <AssistantPage
              currentProfile={currentProfile}
              activeVenueId={activeVenueId}
              venues={venues}
            />
          )
        },
        {
          path: '*',
          element: <Navigate to="/" replace />
        }
      ]
    }
  ]);

  return (
    <>
      {showSplash && <SplashScreen onFinish={() => setShowSplash(false)} />}
      <RouterProvider router={router} />
    </>
  );
}
