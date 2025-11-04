import React, { useState, useEffect } from 'react';
import { Table, Tabs, Card, Typography, Space, Empty, Button } from 'antd';
import type { TabsProps } from 'antd';
import type { SortOrder } from 'antd/es/table/interface';
import { useAppState } from '../store';
import { useNavigate } from 'react-router-dom';
import { DownloadOutlined } from '@ant-design/icons';
import * as XLSX from 'xlsx';
import { 
  get_consecutive_matches, 
  get_inactive_players, 
  get_group_point_difference,
  get_player_point_difference,
  get_pair_point_difference,
  get_player_consecutive_matches_count,
  get_player_consecutive_matches_three,
  get_player_consecutive_matches_four
} from '../data-utils.ts';
import DataTransfer from '../components/DataTransfer';

const { Title } = Typography;

// 定义表格数据类型
interface GroupRanking {
  id: string;
  group: string;
  wins: number;
  losses: number;
  winRate: number;
  pointsWon: number;
  pointsLost: number;
  pointDiff: number;
  points: number;
}

interface PlayerWinRate {
  id: string;
  player: string;
  wins: number;
  total: number;
  winRate: number;
  pointsWon: number;
  pointsLost: number;
  pointDiff: number;
  realName?: string;
}

interface PairWinRate {
  id: string;
  pair: string;
  wins: number;
  total: number;
  winRate: number;
  pointsWon: number;
  pointsLost: number;
  pointDiff: number;
  realName?: string;
}

const DataManagement: React.FC = () => {
  const { matches, timeSlots } = useAppState();
  const [consecutiveMatches, setConsecutiveMatches] = useState<any[]>([]);
  const [inactivePlayers, setInactivePlayers] = useState<any[]>([]);
  const [groupRankings, setGroupRankings] = useState<GroupRanking[]>([]);
  const [playerWinRates, setPlayerWinRates] = useState<PlayerWinRate[]>([]);
  const [pairWinRates, setPairWinRates] = useState<PairWinRate[]>([]);
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
      setGroupRankings(get_group_point_difference(matches));
      setPlayerWinRates(get_player_point_difference(matches));
      setPairWinRates(get_pair_point_difference(matches));
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
            setGroupRankings(get_group_point_difference(parsedMatches));
            setPlayerWinRates(get_player_point_difference(parsedMatches));
            setPairWinRates(get_pair_point_difference(parsedMatches));
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
        <DataTransfer />
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
      sorter: (a: GroupRanking, b: GroupRanking) => a.group.localeCompare(b.group),
    },
    {
      title: '积分',
      dataIndex: 'points',
      key: 'points',
      sorter: (a: GroupRanking, b: GroupRanking) => a.points - b.points,
      defaultSortOrder: 'descend' as SortOrder,
    },
    {
      title: '胜场',
      dataIndex: 'wins',
      key: 'wins',
      sorter: (a: GroupRanking, b: GroupRanking) => a.wins - b.wins,
    },
    {
      title: '负场',
      dataIndex: 'losses',
      key: 'losses',
      sorter: (a: GroupRanking, b: GroupRanking) => a.losses - b.losses,
    },
    {
      title: '胜率',
      dataIndex: 'winRate',
      key: 'winRate',
      sorter: (a: GroupRanking, b: GroupRanking) => a.winRate - b.winRate,
      render: (text: number) => `${(text * 100).toFixed(1)}%`,
    },
    {
      title: '得分',
      dataIndex: 'pointsWon',
      key: 'pointsWon',
      sorter: (a: GroupRanking, b: GroupRanking) => a.pointsWon - b.pointsWon,
    },
    {
      title: '失分',
      dataIndex: 'pointsLost',
      key: 'pointsLost',
      sorter: (a: GroupRanking, b: GroupRanking) => a.pointsLost - b.pointsLost,
    },
    {
      title: '净胜球',
      dataIndex: 'pointDiff',
      key: 'pointDiff',
      sorter: (a: GroupRanking, b: GroupRanking) => a.pointDiff - b.pointDiff,
      render: (text: number) => {
        const value = text;
        return (
          <span style={{ color: value > 0 ? 'green' : value < 0 ? 'red' : 'inherit' }}>
            {value > 0 ? `+${value}` : value}
          </span>
        );
      },
    },
  ];

  const playerWinRatesColumns = [
    {
      title: '选手',
      dataIndex: 'player',
      key: 'player',
      sorter: (a: PlayerWinRate, b: PlayerWinRate) => a.player.localeCompare(b.player),
    },
    {
      title: '姓名',
      dataIndex: 'realName',
      key: 'realName',
      sorter: (a: PlayerWinRate, b: PlayerWinRate) => (a.realName || '').localeCompare(b.realName || ''),
    },
    {
      title: '胜场',
      dataIndex: 'wins',
      key: 'wins',
      sorter: (a: PlayerWinRate, b: PlayerWinRate) => a.wins - b.wins,
    },
    {
      title: '总场次',
      dataIndex: 'total',
      key: 'total',
      sorter: (a: PlayerWinRate, b: PlayerWinRate) => a.total - b.total,
    },
    {
      title: '胜率',
      dataIndex: 'winRate',
      key: 'winRate',
      sorter: (a: PlayerWinRate, b: PlayerWinRate) => a.winRate - b.winRate,
      defaultSortOrder: 'descend' as SortOrder,
      render: (text: number) => `${(text * 100).toFixed(1)}%`,
    },
    {
      title: '得分',
      dataIndex: 'pointsWon',
      key: 'pointsWon',
      sorter: (a: PlayerWinRate, b: PlayerWinRate) => a.pointsWon - b.pointsWon,
    },
    {
      title: '失分',
      dataIndex: 'pointsLost',
      key: 'pointsLost',
      sorter: (a: PlayerWinRate, b: PlayerWinRate) => a.pointsLost - b.pointsLost,
    },
    {
      title: '净胜球',
      dataIndex: 'pointDiff',
      key: 'pointDiff',
      sorter: (a: PlayerWinRate, b: PlayerWinRate) => a.pointDiff - b.pointDiff,
      render: (text: number) => {
        const value = text;
        return (
          <span style={{ color: value > 0 ? 'green' : value < 0 ? 'red' : 'inherit' }}>
            {value > 0 ? `+${value}` : value}
          </span>
        );
      },
    },
  ];

  const pairWinRatesColumns = [
    {
      title: '组合',
      dataIndex: 'pair',
      key: 'pair',
      sorter: (a: PairWinRate, b: PairWinRate) => a.pair.localeCompare(b.pair),
    },
    {
      title: '姓名',
      dataIndex: 'realName',
      key: 'realName',
      sorter: (a: PairWinRate, b: PairWinRate) => (a.realName || '').localeCompare(b.realName || ''),
    },
    {
      title: '胜场',
      dataIndex: 'wins',
      key: 'wins',
      sorter: (a: PairWinRate, b: PairWinRate) => a.wins - b.wins,
    },
    {
      title: '总场次',
      dataIndex: 'total',
      key: 'total',
      sorter: (a: PairWinRate, b: PairWinRate) => a.total - b.total,
    },
    {
      title: '胜率',
      dataIndex: 'winRate',
      key: 'winRate',
      sorter: (a: PairWinRate, b: PairWinRate) => a.winRate - b.winRate,
      defaultSortOrder: 'descend' as SortOrder,
      render: (text: number) => `${(text * 100).toFixed(1)}%`,
    },
    {
      title: '得分',
      dataIndex: 'pointsWon',
      key: 'pointsWon',
      sorter: (a: PairWinRate, b: PairWinRate) => a.pointsWon - b.pointsWon,
    },
    {
      title: '失分',
      dataIndex: 'pointsLost',
      key: 'pointsLost',
      sorter: (a: PairWinRate, b: PairWinRate) => a.pointsLost - b.pointsLost,
    },
    {
      title: '净胜球',
      dataIndex: 'pointDiff',
      key: 'pointDiff',
      sorter: (a: PairWinRate, b: PairWinRate) => a.pointDiff - b.pointDiff,
      render: (text: number) => {
        const value = text;
        return (
          <span style={{ color: value > 0 ? 'green' : value < 0 ? 'red' : 'inherit' }}>
            {value > 0 ? `+${value}` : value}
          </span>
        );
      },
    },
  ];

  const items: TabsProps['items'] = [
    {
      key: 'data-transfer',
      label: '数据迁移',
      children: <DataTransfer />,
    },
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
              pagination={false}
              showSorterTooltip={{ title: '点击可以切换升序/降序' }}
            />
          </Card>
          <Card title="选手胜率">
            <Table
              dataSource={playerWinRates}
              columns={playerWinRatesColumns}
              rowKey="id"
              pagination={{ pageSize: 10 }}
              showSorterTooltip={{ title: '点击可以切换升序/降序' }}
            />
          </Card>
          <Card title="组合胜率">
            <Table
              dataSource={pairWinRates}
              columns={pairWinRatesColumns}
              rowKey="id"
              pagination={{ pageSize: 10 }}
              showSorterTooltip={{ title: '点击可以切换升序/降序' }}
            />
          </Card>
        </Space>
      ),
    },
  ];

  const exportToExcel = () => {
    // 创建工作簿
    const workbook = XLSX.utils.book_new();

    // 1. 导出团体实时排名
    const groupRankingsData: (string | number)[][] = [
      ['团体', '积分', '胜场', '负场', '胜率', '得分', '失分', '净胜球']
    ];
    groupRankings.forEach(item => {
      groupRankingsData.push([
        item.group,
        item.points.toString(),
        item.wins.toString(),
        item.losses.toString(),
        `${(item.winRate * 100).toFixed(1)}%`,
        item.pointsWon.toString(),
        item.pointsLost.toString(),
        item.pointDiff.toString()
      ]);
    });
    const groupRankingsSheet = XLSX.utils.aoa_to_sheet(groupRankingsData);
    XLSX.utils.book_append_sheet(workbook, groupRankingsSheet, '团体实时排名');

    // 2. 导出选手胜率
    const playerWinRatesData: (string | number)[][] = [
      ['选手', '姓名', '胜场', '总场次', '胜率', '得分', '失分', '净胜球']
    ];
    playerWinRates.forEach(item => {
      playerWinRatesData.push([
        item.player,
        item.realName || '',
        item.wins.toString(),
        item.total.toString(),
        `${(item.winRate * 100).toFixed(1)}%`,
        item.pointsWon.toString(),
        item.pointsLost.toString(),
        item.pointDiff.toString()
      ]);
    });
    const playerWinRatesSheet = XLSX.utils.aoa_to_sheet(playerWinRatesData);
    XLSX.utils.book_append_sheet(workbook, playerWinRatesSheet, '选手胜率');

    // 3. 导出组合胜率
    const pairWinRatesData: (string | number)[][] = [
      ['组合', '姓名', '胜场', '总场次', '胜率', '得分', '失分', '净胜球']
    ];
    pairWinRates.forEach(item => {
      pairWinRatesData.push([
        item.pair,
        item.realName || '',
        item.wins.toString(),
        item.total.toString(),
        `${(item.winRate * 100).toFixed(1)}%`,
        item.pointsWon.toString(),
        item.pointsLost.toString(),
        item.pointDiff.toString()
      ]);
    });
    const pairWinRatesSheet = XLSX.utils.aoa_to_sheet(pairWinRatesData);
    XLSX.utils.book_append_sheet(workbook, pairWinRatesSheet, '组合胜率');

    // 设置列宽
    const setColumnWidths = (sheet: XLSX.WorkSheet) => {
      const colWidths = [
        { wch: 15 }, // 团体/选手/组合
        { wch: 15 }, // 姓名
        { wch: 10 }, // 胜场
        { wch: 10 }, // 总场次
        { wch: 10 }, // 胜率
        { wch: 10 }, // 得分
        { wch: 10 }, // 失分
        { wch: 10 }  // 净胜球
      ];
      sheet['!cols'] = colWidths;
    };

    setColumnWidths(groupRankingsSheet);
    setColumnWidths(playerWinRatesSheet);
    setColumnWidths(pairWinRatesSheet);

    // 导出文件
    XLSX.writeFile(workbook, '比赛结果统计.xlsx');
  };

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <Title level={2}>数据管理</Title>
        <Button 
          type="primary" 
          icon={<DownloadOutlined />}
          onClick={exportToExcel}
        >
          导出Excel
        </Button>
      </div>
      <Tabs defaultActiveKey="1" items={items} />
    </div>
  );
};

export default DataManagement; 