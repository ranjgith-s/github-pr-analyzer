import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Login from '../Login/Login';
import MetricsPage from '../../pages/Metrics/MetricsPage';
import Home from '../../pages/Home/Home';
import Header from '../Header/Header';
import PullRequestPage from '../PullRequest/PullRequest';
import DeveloperMetricsPage from '../../pages/DeveloperMetrics/DeveloperMetricsPage';
import RepoInsightsPage from '../../pages/RepoInsights/RepoInsightsPage';
import DeveloperProfilePage from '../../pages/DeveloperProfile/DeveloperProfilePage';
import { useAuth } from '../../contexts/AuthContext/AuthContext';
import { getDeveloperProfile } from '../../utils/services/githubService';
import RepoMetrics from '../RepoMetrics/RepoMetrics';

export default function App() {
  const { token } = useAuth();
  const location = useLocation();
  const [developerName, setDeveloperName] = useState<string | null>(null);

  useEffect(() => {
    async function fetchName() {
      const match = location.pathname.match(/^\/developer\/(\w+)/);
      if (match && token) {
        try {
          const profile = await getDeveloperProfile(token, match[1]);
          setDeveloperName(profile.name || profile.login);
        } catch {
          setDeveloperName(null);
        }
      } else {
        setDeveloperName(null);
      }
    }
    fetchName();
  }, [location.pathname, token]);

  let breadcrumbs: { label: string; to: string }[] = [];
  if (
    location.pathname.startsWith('/insights') ||
    location.pathname.startsWith('/pr')
  ) {
    breadcrumbs = [{ label: 'Pull request insights', to: '/insights' }];
  } else if (location.pathname.startsWith('/developer/')) {
    breadcrumbs = [
      { label: 'Developer Insights', to: '/developer' },
      developerName
        ? { label: developerName, to: location.pathname }
        : { label: 'Unknown', to: location.pathname },
    ];
  } else if (location.pathname.startsWith('/developer')) {
    breadcrumbs = [{ label: 'Developer Insights', to: '/developer' }];
  } else if (location.pathname.startsWith('/repo/')) {
    const match = location.pathname.match(/^\/repo\/([^/]+)\/([^/]+)/);
    breadcrumbs = [
      { label: 'Repo insights', to: '/repo' },
      match
        ? { label: match[2], to: location.pathname }
        : { label: '', to: location.pathname },
    ];
  } else if (location.pathname.startsWith('/repo')) {
    breadcrumbs = [{ label: 'Repo insights', to: '/repo' }];
  }

  return (
    <div className="text-foreground bg-background min-h-screen">
      {token && <Header breadcrumbs={breadcrumbs} />}
      <div style={{ padding: token ? 24 : 0 }}>
        <Routes>
          <Route
            path="/login"
            element={token ? <Navigate to="/" replace /> : <Login />}
          />
          <Route
            path="/"
            element={token ? <Home /> : <Navigate to="/login" replace />}
          />
          <Route path="/insights" element={<MetricsPage />} />
          <Route
            path="/pr/:owner/:repo/:number"
            element={<PullRequestPage />}
          />
          <Route path="/developer" element={<DeveloperMetricsPage />} />
          <Route
            path="/developer/:username"
            element={<DeveloperProfilePage />}
          />
          <Route path="/repo" element={<RepoInsightsPage />} />
          <Route path="/repo/:owner/:repo" element={<RepoMetrics />} />
        </Routes>
      </div>
    </div>
  );
}
