import React, { useMemo, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { Layout, Menu, ConfigProvider, Button, Drawer, Grid, MenuProps } from 'antd';
import {
  TeamOutlined,
  ScheduleOutlined,
  TrophyOutlined,
  SettingOutlined,
  DashboardOutlined,
  BarChartOutlined,
  MenuOutlined,
} from '@ant-design/icons';
import zhCN from 'antd/locale/zh_CN';

import TournamentSetup from './pages/TournamentSetup';
import TeamManagement from './pages/TeamManagement';
import FormationManagement from './pages/FormationManagement';
import ScheduleGeneration from './pages/ScheduleGeneration';
import MatchList from './pages/MatchList';
import DataManagement from './pages/DataManagement';
import { AppProvider } from './store';

const { Header, Content, Sider } = Layout;
const { useBreakpoint } = Grid;

type MenuItemConfig = {
  key: string;
  label: string;
  path: string;
  icon: React.ReactNode;
};

const MENU_ITEMS: MenuItemConfig[] = [
  { key: 'tournament-setup', label: '比赛统筹', path: '/tournament-setup', icon: <DashboardOutlined /> },
  { key: 'teams', label: '队伍管理', path: '/teams', icon: <TeamOutlined /> },
  { key: 'formations', label: '阵容配置', path: '/formations', icon: <SettingOutlined /> },
  { key: 'schedule', label: '赛程生成', path: '/schedule', icon: <ScheduleOutlined /> },
  { key: 'matches', label: '比赛管理', path: '/matches', icon: <TrophyOutlined /> },
  { key: 'data', label: '数据管理', path: '/data', icon: <BarChartOutlined /> },
];

const pathToKey = (pathname: string) => {
  if (pathname === '/' || pathname.startsWith('/tournament-setup')) {
    return 'tournament-setup';
  }
  const matched = MENU_ITEMS.find((item) => pathname.startsWith(item.path));
  return matched?.key ?? 'tournament-setup';
};

const AppLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const screens = useBreakpoint();
  const isMobile = !screens.md;
  const [drawerOpen, setDrawerOpen] = useState(false);

  const selectedKeys = useMemo(() => [pathToKey(location.pathname)], [location.pathname]);

  const items: MenuProps['items'] = useMemo(
    () =>
      MENU_ITEMS.map((item) => ({
        key: item.key,
        icon: item.icon,
        label: item.label,
      })),
    []
  );

  const handleMenuClick: MenuProps['onClick'] = ({ key }) => {
    const target = MENU_ITEMS.find((item) => item.key === key);
    if (target) {
      navigate(target.path);
    }
    if (isMobile) {
      setDrawerOpen(false);
    }
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header className="app-header">
        {isMobile && (
          <Button
            type="text"
            icon={<MenuOutlined />}
            className="app-menu-button"
            onClick={() => setDrawerOpen(true)}
            aria-label="打开导航菜单"
          />
        )}
        <h1 className="app-header-title">羽毛球赛事管理系统</h1>
      </Header>
      <Layout>
        {!isMobile && (
          <Sider width={200} style={{ background: '#fff' }}>
            <Menu
              mode="inline"
              selectedKeys={selectedKeys}
              onClick={handleMenuClick}
              style={{ height: '100%', borderRight: 0 }}
              items={items}
            />
          </Sider>
        )}
        <Layout style={{ padding: isMobile ? '16px' : '24px' }}>
          <Content
            className="app-content"
            style={{
              padding: isMobile ? 16 : 24,
              margin: 0,
              minHeight: 280,
              background: '#fff',
              borderRadius: isMobile ? 0 : 8,
            }}
          >
            <Routes>
              <Route path="/" element={<TournamentSetup />} />
              <Route path="/tournament-setup" element={<TournamentSetup />} />
              <Route path="/teams" element={<TeamManagement />} />
              <Route path="/formations" element={<FormationManagement />} />
              <Route path="/schedule" element={<ScheduleGeneration />} />
              <Route path="/matches" element={<MatchList />} />
              <Route path="/data" element={<DataManagement />} />
            </Routes>
          </Content>
        </Layout>
      </Layout>

      {isMobile && (
        <Drawer
          title="导航菜单"
          placement="left"
          width={260}
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          bodyStyle={{ padding: 0 }}
        >
          <Menu
            mode="inline"
            selectedKeys={selectedKeys}
            onClick={handleMenuClick}
            style={{ borderRight: 0 }}
            items={items}
          />
        </Drawer>
      )}
    </Layout>
  );
};

const App: React.FC = () => {
  return (
    <ConfigProvider locale={zhCN}>
      <AppProvider>
        <Router>
          <AppLayout />
        </Router>
      </AppProvider>
    </ConfigProvider>
  );
};

export default App; 
