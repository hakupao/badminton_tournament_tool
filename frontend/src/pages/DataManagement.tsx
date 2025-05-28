import React, { useState, useEffect } from 'react';
import { Table, Tabs, Card, Typography, Space, Empty, Button } from 'antd';
import type { TabsProps } from 'antd';
import { useAppState } from '../store';
import { useNavigate } from 'react-router-dom';
import { 
  get_consecutive_matches, 
  get_inactive_players, 
  get_group_rankings,
  get_player_win_rates,
  get_pair_win_rates,
  get_player_consecutive_matches_count,
  get_player_consecutive_matches_three,
  get_player_consecutive_matches_four
} from '../data-utils.ts';

const { Title } = Typography;

const DataManagement: React.FC = () => {
  const { matches, timeSlots } = useAppState();
  const [consecutiveMatches, setConsecutiveMatches] = useState<any[]>([]);
  const [inactivePlayers, setInactivePlayers] = useState<any[]>([]);
  const [groupRankings, setGroupRankings] = useState<any[]>([]);
  const [playerWinRates, setPlayerWinRates] = useState<any[]>([]);
  const [pairWinRates, setPairWinRates] = useState<any[]>([]);
  const [playerConsecutiveCount, setPlayerConsecutiveCount] = useState<any[]>([]);
  const [playerConsecutiveThree, setPlayerConsecutiveThree] = useState<any[]>([]);
  const [playerConsecutiveFour, setPlayerConsecutiveFour] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    // 使用本地数据计算统计结果
    if (matches && matches.length > 0) {
      console.log('数据管理页面刷新数据', matches);
      setConsecutiveMatches(get_consecutive_matches(matches));
      setInactivePlayers(get_inactive_players(matches));
      setGroupRankings(get_group_rankings(matches));
      setPlayerWinRates(get_player_win_rates(matches));
      setPairWinRates(get_pair_win_rates(matches));
      setPlayerConsecutiveCount(get_player_consecutive_matches_count(matches));
      setPlayerConsecutiveThree(get_player_consecutive_matches_three(matches));
      setPlayerConsecutiveFour(get_player_consecutive_matches_four(matches));
    }
  }, [matches, timeSlots]);

  // 添加定时刷新功能
  useEffect(() => {
    // 每10秒刷新一次数据
    const timer = setInterval(() => {
      const savedMatches = localStorage.getItem('badminton_matches');
      if (savedMatches) {
        try {
          const parsedMatches = JSON.parse(savedMatches);
          if (parsedMatches.length > 0 && JSON.stringify(parsedMatches) !== JSON.stringify(matches)) {
            console.log('从localStorage更新数据');
            setConsecutiveMatches(get_consecutive_matches(parsedMatches));
            setInactivePlayers(get_inactive_players(parsedMatches));
            setGroupRankings(get_group_rankings(parsedMatches));
            setPlayerWinRates(get_player_win_rates(parsedMatches));
            setPairWinRates(get_pair_win_rates(parsedMatches));
            setPlayerConsecutiveCount(get_player_consecutive_matches_count(parsedMatches));
            setPlayerConsecutiveThree(get_player_consecutive_matches_three(parsedMatches));
            setPlayerConsecutiveFour(get_player_consecutive_matches_four(parsedMatches));
          }
        } catch (error) {
          console.error('解析比赛数据失败', error);
        }
      }
    }, 10000);
    
    return () => clearInterval(timer);
  }, []);

  // 如果没有比赛数据，显示空页面
  if (!matches || matches.length === 0) {
    return (
      <div style={{ padding: '24px' }}>
        <Title level={2}>数据管理</Title>
        <Empty
          description="暂无比赛数据"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        >
          <Button
            type="primary"
            onClick={() => navigate('/schedule')}
          >
            去生成赛程
          </Button>
        </Empty>
      </div>
    );
  }

  const consecutiveMatchesColumns = [
    {
      title: '选手',
      dataIndex: 'player',
      key: 'player',
    },
    {
      title: '时间段1',
      dataIndex: 'timeSlot1',
      key: 'timeSlot1',
    },
    {
      title: '时间段2',
      dataIndex: 'timeSlot2',
      key: 'timeSlot2',
    },
  ];

  const consecutiveThreeMatchesColumns = [
    {
      title: '选手',
      dataIndex: 'player',
      key: 'player',
    },
    {
      title: '时间段1',
      dataIndex: 'timeSlot1',
      key: 'timeSlot1',
    },
    {
      title: '时间段2',
      dataIndex: 'timeSlot2',
      key: 'timeSlot2',
    },
    {
      title: '时间段3',
      dataIndex: 'timeSlot3',
      key: 'timeSlot3',
    },
  ];

  const consecutiveFourMatchesColumns = [
    {
      title: '选手',
      dataIndex: 'player',
      key: 'player',
    },
    {
      title: '时间段1',
      dataIndex: 'timeSlot1',
      key: 'timeSlot1',
    },
    {
      title: '时间段2',
      dataIndex: 'timeSlot2',
      key: 'timeSlot2',
    },
    {
      title: '时间段3',
      dataIndex: 'timeSlot3',
      key: 'timeSlot3',
    },
    {
      title: '时间段4',
      dataIndex: 'timeSlot4',
      key: 'timeSlot4',
    },
  ];

  const inactivePlayersColumns = [
    {
      title: '选手',
      dataIndex: 'player',
      key: 'player',
    },
    {
      title: '最后比赛时间',
      dataIndex: 'lastMatchTime',
      key: 'lastMatchTime',
    },
  ];

  const playerConsecutiveCountColumns = [
    {
      title: '选手',
      dataIndex: 'player',
      key: 'player',
    },
    {
      title: '最长连续参赛次数',
      dataIndex: 'maxConsecutiveMatches',
      key: 'maxConsecutiveMatches',
    },
  ];

  const groupRankingsColumns = [
    {
      title: '团体',
      dataIndex: 'group',
      key: 'group',
    },
    {
      title: '胜场',
      dataIndex: 'wins',
      key: 'wins',
    },
    {
      title: '负场',
      dataIndex: 'losses',
      key: 'losses',
    },
    {
      title: '胜率',
      dataIndex: 'winRate',
      key: 'winRate',
      render: (text: number) => `${(text * 100).toFixed(1)}%`,
    },
  ];

  const playerWinRatesColumns = [
    {
      title: '选手',
      dataIndex: 'player',
      key: 'player',
    },
    {
      title: '胜场',
      dataIndex: 'wins',
      key: 'wins',
    },
    {
      title: '总场次',
      dataIndex: 'total',
      key: 'total',
    },
    {
      title: '胜率',
      dataIndex: 'winRate',
      key: 'winRate',
      render: (text: number) => `${(text * 100).toFixed(1)}%`,
    },
  ];

  const pairWinRatesColumns = [
    {
      title: '组合',
      dataIndex: 'pair',
      key: 'pair',
    },
    {
      title: '胜场',
      dataIndex: 'wins',
      key: 'wins',
    },
    {
      title: '总场次',
      dataIndex: 'total',
      key: 'total',
    },
    {
      title: '胜率',
      dataIndex: 'winRate',
      key: 'winRate',
      render: (text: number) => `${(text * 100).toFixed(1)}%`,
    },
  ];

  const items: TabsProps['items'] = [
    {
      key: '1',
      label: '赛程数据查看',
      children: (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Card title="连续两个时间段都比赛的选手">
            <Table
              dataSource={consecutiveMatches}
              columns={consecutiveMatchesColumns}
              rowKey="id"
            />
          </Card>
          <Card title="连续三个时间段都比赛的选手">
            <Table
              dataSource={playerConsecutiveThree}
              columns={consecutiveThreeMatchesColumns}
              rowKey="id"
            />
          </Card>
          <Card title="连续四个时间段都比赛的选手">
            <Table
              dataSource={playerConsecutiveFour}
              columns={consecutiveFourMatchesColumns}
              rowKey="id"
            />
          </Card>
          <Card title="连续三个时间段未参赛的选手">
            <Table
              dataSource={inactivePlayers}
              columns={inactivePlayersColumns}
              rowKey="id"
            />
          </Card>
          <Card title="选手连续参赛统计">
            <Table
              dataSource={playerConsecutiveCount}
              columns={playerConsecutiveCountColumns}
              rowKey="id"
            />
          </Card>
        </Space>
      ),
    },
    {
      key: '2',
      label: '比赛结果查看',
      children: (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Card title="团体实时排名">
            <Table
              dataSource={groupRankings}
              columns={groupRankingsColumns}
              rowKey="id"
            />
          </Card>
          <Card title="选手胜率">
            <Table
              dataSource={playerWinRates}
              columns={playerWinRatesColumns}
              rowKey="id"
            />
          </Card>
          <Card title="组合胜率">
            <Table
              dataSource={pairWinRates}
              columns={pairWinRatesColumns}
              rowKey="id"
            />
          </Card>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>数据管理</Title>
      <Tabs defaultActiveKey="1" items={items} />
    </div>
  );
};

export default DataManagement; 