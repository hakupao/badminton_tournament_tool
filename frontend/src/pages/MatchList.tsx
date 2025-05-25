import React, { useState, useEffect } from 'react';
import { Table, Tag, Button, Modal, InputNumber, Space, message, Empty } from 'antd';
import { EditOutlined, TrophyOutlined } from '@ant-design/icons';
import { Match } from '../types';
import { matchApi } from '../api';

const MatchList: React.FC = () => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(false);
  const [scoreModalVisible, setScoreModalVisible] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [scores, setScores] = useState<{ set1A: number; set1B: number; set2A: number; set2B: number }>({
    set1A: 0,
    set1B: 0,
    set2A: 0,
    set2B: 0,
  });

  useEffect(() => {
    loadMatches();
  }, []);

  const loadMatches = async () => {
    setLoading(true);
    try {
      const response = await matchApi.getAll();
      setMatches(response.data);
    } catch (error) {
      message.error('加载比赛列表失败');
    } finally {
      setLoading(false);
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
    if (match.scores && match.scores.length >= 2) {
      setScores({
        set1A: match.scores[0]?.teamAScore || 0,
        set1B: match.scores[0]?.teamBScore || 0,
        set2A: match.scores[1]?.teamAScore || 0,
        set2B: match.scores[1]?.teamBScore || 0,
      });
    } else {
      setScores({ set1A: 0, set1B: 0, set2A: 0, set2B: 0 });
    }
    setScoreModalVisible(true);
  };

  const handleSaveScore = async () => {
    if (!selectedMatch) return;

    const matchScores = [
      { set: 1, teamAScore: scores.set1A, teamBScore: scores.set1B },
      { set: 2, teamAScore: scores.set2A, teamBScore: scores.set2B },
    ];

    try {
      await matchApi.updateScores(selectedMatch.id, matchScores);
      message.success('比分更新成功');
      setScoreModalVisible(false);
      loadMatches();
    } catch (error) {
      message.error('更新比分失败');
    }
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
      render: getMatchTypeName,
    },
    {
      title: '对阵',
      key: 'teams',
      render: (_: any, record: Match) => (
        <Space>
          <span>{record.teamA_Name}</span>
          <span>VS</span>
          <span>{record.teamB_Name}</span>
        </Space>
      ),
    },
    {
      title: '比分',
      key: 'scores',
      render: (_: any, record: Match) => {
        if (!record.scores || record.scores.length === 0) {
          return '-';
        }
        return (
          <Space>
            {record.scores.map((score, index) => (
              <span key={index}>
                {score.teamAScore}:{score.teamBScore}
              </span>
            ))}
          </Space>
        );
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: getStatusTag,
    },
    {
      title: '获胜方',
      key: 'winner',
      render: (_: any, record: Match) => {
        if (!record.winner_TeamId) return '-';
        return record.winner_TeamId === record.teamA_Id ? (
          <Tag color="gold">{record.teamA_Name}</Tag>
        ) : (
          <Tag color="gold">{record.teamB_Name}</Tag>
        );
      },
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: Match) => (
        <Button
          type="link"
          icon={<EditOutlined />}
          onClick={() => handleEditScore(record)}
        >
          录入比分
        </Button>
      ),
    },
  ];

  if (matches.length === 0 && !loading) {
    return (
      <Empty
        description="暂无比赛"
        image={Empty.PRESENTED_IMAGE_SIMPLE}
      >
        <Button type="primary" href="/schedule">
          去生成赛程
        </Button>
      </Empty>
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

      {/* 比分编辑对话框 */}
      <Modal
        title={`录入比分 - ${selectedMatch?.teamA_Name} VS ${selectedMatch?.teamB_Name}`}
        open={scoreModalVisible}
        onOk={handleSaveScore}
        onCancel={() => setScoreModalVisible(false)}
        okText="保存"
        cancelText="取消"
      >
        <div style={{ marginBottom: 16 }}>
          <h4>第一局</h4>
          <Space>
            <span>{selectedMatch?.teamA_Name}:</span>
            <InputNumber
              min={0}
              max={30}
              value={scores.set1A}
              onChange={(value) => setScores({ ...scores, set1A: value || 0 })}
            />
            <span>:</span>
            <InputNumber
              min={0}
              max={30}
              value={scores.set1B}
              onChange={(value) => setScores({ ...scores, set1B: value || 0 })}
            />
            <span>{selectedMatch?.teamB_Name}</span>
          </Space>
        </div>
        <div>
          <h4>第二局</h4>
          <Space>
            <span>{selectedMatch?.teamA_Name}:</span>
            <InputNumber
              min={0}
              max={30}
              value={scores.set2A}
              onChange={(value) => setScores({ ...scores, set2A: value || 0 })}
            />
            <span>:</span>
            <InputNumber
              min={0}
              max={30}
              value={scores.set2B}
              onChange={(value) => setScores({ ...scores, set2B: value || 0 })}
            />
            <span>{selectedMatch?.teamB_Name}</span>
          </Space>
        </div>
      </Modal>
    </div>
  );
};

export default MatchList; 