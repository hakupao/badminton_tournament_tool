import React, { useState, useEffect } from 'react';
import { Table, Tag, Button, Modal, InputNumber, Space, message, Empty } from 'antd';
import { EditOutlined, TrophyOutlined } from '@ant-design/icons';
import { Match } from '../types';
import { useNavigate } from 'react-router-dom';
import { useAppState } from '../store';

const MatchList: React.FC = () => {
  const { matches: globalMatches, setMatches: setGlobalMatches } = useAppState();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(false);
  const [scoreModalVisible, setScoreModalVisible] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [scores, setScores] = useState<{ teamAScore: number; teamBScore: number }>({
    teamAScore: 0,
    teamBScore: 0,
  });
  const navigate = useNavigate();

  useEffect(() => {
    // 如果全局状态中有数据，直接使用全局状态
    if (globalMatches && globalMatches.length > 0) {
      setMatches(globalMatches);
    } else {
      // 否则从localStorage加载
      loadMatches();
    }
  }, [globalMatches]);

  const loadMatches = () => {
    setLoading(true);
    try {
      // 从localStorage加载比赛数据
      const savedMatches = localStorage.getItem('tournamentMatches');
      if (savedMatches) {
        const parsedMatches = JSON.parse(savedMatches);
        setMatches(parsedMatches);
        // 同时更新全局状态
        setGlobalMatches(parsedMatches);
      } else {
        // 如果没有预先准备的比赛数据，尝试从赛程数据转换
        const savedSchedule = localStorage.getItem('tournamentSchedule');
        if (savedSchedule) {
          const scheduleData = JSON.parse(savedSchedule);
          
          // 将赛程数据转换为匹配Match接口的格式
          const localMatches: Match[] = scheduleData.map((item: any, index: number) => ({
            id: `local_${index}`,
            round: Math.ceil(item.timeSlot / 2),
            timeSlot: item.timeSlot - 1, // 适配显示的格式
            court: item.court,
            matchType: item.formation,
            teamA_Id: item.teamA,
            teamB_Id: item.teamB,
            teamA_Name: `队伍${item.teamA}`,
            teamB_Name: `队伍${item.teamB}`,
            teamA_Players: item.teamAPlayers || [],
            teamB_Players: item.teamBPlayers || [],
            teamA_PlayerNames: item.teamAPlayers || [],
            teamB_PlayerNames: item.teamBPlayers || [],
            status: 'pending' as 'pending' | 'ongoing' | 'finished',
            scores: [],
            createdAt: new Date().toISOString()
          }));
          
          setMatches(localMatches);
          // 更新全局状态
          setGlobalMatches(localMatches);
          // 同时保存为比赛格式，以便下次直接加载
          localStorage.setItem('tournamentMatches', JSON.stringify(localMatches));
        } else {
          setMatches([]);
          setGlobalMatches([]);
        }
      }
    } catch (error) {
      message.error('加载比赛列表失败');
      console.error('加载比赛列表错误:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveScore = () => {
    if (!selectedMatch) return;

    const matchScores = [
      { set: 1, teamAScore: scores.teamAScore, teamBScore: scores.teamBScore },
    ];

    try {
      // 根据比分确定获胜者
      const winner_TeamId = scores.teamAScore > scores.teamBScore ? 
        selectedMatch.teamA_Id : 
        scores.teamBScore > scores.teamAScore ? 
          selectedMatch.teamB_Id : 
          undefined;

      // 创建更新后的比赛对象
      const updatedMatch = {
        ...selectedMatch,
        scores: matchScores,
        status: 'finished' as 'pending' | 'ongoing' | 'finished',
        winner_TeamId: winner_TeamId
      };
      
      // 更新本地存储和状态
      saveScoreToLocalStorage(selectedMatch.id, matchScores, winner_TeamId);
      
      message.success('比分更新成功');
      setScoreModalVisible(false);
      // 不需要重新加载，因为状态已经更新
    } catch (error) {
      message.error('更新比分失败');
      console.error('更新比分错误:', error);
    }
  };

  // 使用localStorage保存比分，同时更新全局状态
  const saveScoreToLocalStorage = (matchId: string, newScores: any, winner_TeamId?: string) => {
    const updatedMatches = matches.map(match => {
      if (match.id === matchId) {
        return {
          ...match,
          scores: newScores,
          status: 'finished' as 'pending' | 'ongoing' | 'finished',
          winner_TeamId: winner_TeamId
        };
      }
      return match;
    }) as Match[];
    
    setMatches(updatedMatches);
    // 更新全局状态
    setGlobalMatches(updatedMatches);
    localStorage.setItem('tournamentMatches', JSON.stringify(updatedMatches));
    
    // 手动触发更新后端
    try {
      fetch('/api/matches', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          matches: updatedMatches,
          timeSlots: Array.from(new Set(updatedMatches.map(m => `第${m.timeSlot + 1}时段`))) 
        }),
      });
    } catch (error) {
      console.error('同步数据到后端失败:', error);
    }
  };

  const getMatchTypeName = (type: string) => {
    switch (type) {
      case 'MD1': return '第一男双';
      case 'MD2': return '第二男双';
      case 'XD1': return '混双';
      default: return type;
    }
  };

  const getStatusTag = (status: string) => {
    switch (status) {
      case 'pending':
        return <Tag color="default">未开始</Tag>;
      case 'ongoing':
        return <Tag color="processing">进行中</Tag>;
      case 'finished':
        return <Tag color="success">已结束</Tag>;
      default:
        return <Tag>{status}</Tag>;
    }
  };

  const handleEditScore = (match: Match) => {
    setSelectedMatch(match);
    if (match.scores && match.scores.length > 0) {
      setScores({
        teamAScore: match.scores[0]?.teamAScore || 0,
        teamBScore: match.scores[0]?.teamBScore || 0,
      });
    } else {
      setScores({ teamAScore: 0, teamBScore: 0 });
    }
    setScoreModalVisible(true);
  };

  const columns = [
    {
      title: '时间段',
      dataIndex: 'timeSlot',
      key: 'timeSlot',
      sorter: (a: Match, b: Match) => a.timeSlot - b.timeSlot,
      render: (timeSlot: number) => `第${timeSlot + 1}时段`,
    },
    {
      title: '场地',
      dataIndex: 'court',
      key: 'court',
      render: (court: number) => `${court}号场`,
    },
    {
      title: '比赛类型',
      dataIndex: 'matchType',
      key: 'matchType',
      render: (type: string) => getMatchTypeName(type),
    },
    {
      title: '对阵',
      key: 'teams',
      render: (record: Match) => (
        <Space>
          <Tag color="blue">{record.teamA_Name}</Tag>
          <span>VS</span>
          <Tag color="red">{record.teamB_Name}</Tag>
        </Space>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => getStatusTag(status),
    },
    {
      title: '操作',
      key: 'action',
      render: (record: Match) => (
        <Space>
          <Button
            type="primary"
            icon={<EditOutlined />}
            onClick={() => handleEditScore(record)}
            disabled={false}
          >
            记录比分
          </Button>
        </Space>
      ),
    },
  ];

  if (matches.length === 0 && !loading) {
    return (
      <div>
        <h2 style={{ marginBottom: 24 }}>
          <TrophyOutlined /> 比赛列表
        </h2>
        <Empty
          description="暂无比赛"
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

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>
        <TrophyOutlined /> 比赛列表
      </h2>
      
      <Table
        columns={columns}
        dataSource={matches}
        rowKey="id"
        loading={loading}
        pagination={{
          pageSize: 20,
          showTotal: (total) => `共 ${total} 场比赛`,
        }}
      />

      <Modal
        title="记录比分"
        open={scoreModalVisible}
        onOk={handleSaveScore}
        onCancel={() => setScoreModalVisible(false)}
        okText="保存"
        cancelText="取消"
      >
        {selectedMatch && (
          <Space direction="vertical" style={{ width: '100%' }}>
            <div>
              <Tag color="blue">{selectedMatch.teamA_Name}</Tag>
              <InputNumber
                min={0}
                max={30}
                value={scores.teamAScore}
                onChange={(value) => setScores(prev => ({ ...prev, teamAScore: value || 0 }))}
              />
            </div>
            <div>
              <Tag color="red">{selectedMatch.teamB_Name}</Tag>
              <InputNumber
                min={0}
                max={30}
                value={scores.teamBScore}
                onChange={(value) => setScores(prev => ({ ...prev, teamBScore: value || 0 }))}
              />
            </div>
          </Space>
        )}
      </Modal>
    </div>
  );
};

export default MatchList; 