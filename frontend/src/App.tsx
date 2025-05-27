import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Layout, Menu, ConfigProvider } from 'antd';
import {
  TeamOutlined,
  ScheduleOutlined,
  TrophyOutlined,
  SettingOutlined,
  DashboardOutlined,
  BarChartOutlined,
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

const App: React.FC = () => {
  return (
    <ConfigProvider locale={zhCN}>
      <AppProvider>
        <Router>
          <Layout style={{ minHeight: '100vh' }}>
            <Header style={{ display: 'flex', alignItems: 'center' }}>
              <h1 style={{ color: 'white', margin: 0 }}>羽毛球赛事管理系统</h1>
            </Header>
            <Layout>
              <Sider width={200} style={{ background: '#fff' }}>
                <Menu
                  mode="inline"
                  defaultSelectedKeys={['tournament-setup']}
                  style={{ height: '100%', borderRight: 0 }}
                >
                  <Menu.Item key="tournament-setup" icon={<DashboardOutlined />}>
                    <Link to="/tournament-setup">比赛统筹</Link>
                  </Menu.Item>
                  <Menu.Item key="teams" icon={<TeamOutlined />}>
                    <Link to="/teams">队伍管理</Link>
                  </Menu.Item>
                  <Menu.Item key="formations" icon={<SettingOutlined />}>
                    <Link to="/formations">阵容配置</Link>
                  </Menu.Item>
                  <Menu.Item key="schedule" icon={<ScheduleOutlined />}>
                    <Link to="/schedule">赛程生成</Link>
                  </Menu.Item>
                  <Menu.Item key="matches" icon={<TrophyOutlined />}>
                    <Link to="/matches">比赛管理</Link>
                  </Menu.Item>
                  <Menu.Item key="data" icon={<BarChartOutlined />}>
                    <Link to="/data">数据管理</Link>
                  </Menu.Item>
                </Menu>
              </Sider>
              <Layout style={{ padding: '24px' }}>
                <Content
                  style={{
                    padding: 24,
                    margin: 0,
                    minHeight: 280,
                    background: '#fff',
                    borderRadius: 8,
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
          </Layout>
        </Router>
      </AppProvider>
    </ConfigProvider>
  );
};

export default App; 