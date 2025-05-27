import React, { useState, useEffect } from 'react';
import { Table, Card, Input, Button, Space, message, Popconfirm, Typography, Tag, Row, Col, Empty } from 'antd';
import { TeamOutlined, SaveOutlined, DeleteOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Title } = Typography;

interface PlayerInfo {
  code: string; // 如 A1, B2
  name: string;
  teamCode: string; // 如 A, B
  playerNumber: number; // 如 1, 2
}

interface TeamInfo {
  code: string; // A, B, C...
  currentPlayerCount: number;
  maxPlayerCount: number;
}

const TeamManagement: React.FC = () => {
  const [tournamentConfig, setTournamentConfig] = useState<any>(null);
  const [players, setPlayers] = useState<PlayerInfo[]>([]);
  const [teams, setTeams] = useState<TeamInfo[]>([]);
  const [editingKey, setEditingKey] = useState<string>('');
  const navigate = useNavigate();

  // 加载比赛统筹配置
  useEffect(() => {
    const savedConfig = localStorage.getItem('tournamentConfig');
    if (savedConfig) {
      const config = JSON.parse(savedConfig);
      setTournamentConfig(config);
      initializeTeamsAndPlayers(config);
    } else {
      message.warning('请先完成比赛统筹配置');
    }
  }, []);

  // 初始化队伍和队员
  const initializeTeamsAndPlayers = (config: any) => {
    const { teamCount, teamCapacity } = config;
    
    // 加载已保存的队员信息
    const savedPlayers = localStorage.getItem('tournamentPlayers');
    let playersData: PlayerInfo[] = [];
    
    if (savedPlayers) {
      playersData = JSON.parse(savedPlayers);
    } else {
      // 初次创建所有队员
      for (let i = 0; i < teamCount; i++) {
        const teamCode = String.fromCharCode(65 + i);
        for (let j = 1; j <= teamCapacity; j++) {
          playersData.push({
            code: `${teamCode}${j}`,
            name: '',
            teamCode,
            playerNumber: j,
          });
        }
      }
    }
    
    setPlayers(playersData);
    
    // 生成队伍信息
    const teamsData: TeamInfo[] = [];
    for (let i = 0; i < teamCount; i++) {
      const teamCode = String.fromCharCode(65 + i);
      const teamPlayers = playersData.filter(p => p.teamCode === teamCode);
      const currentCount = teamPlayers.filter(p => p.name || p.code).length;
      
      teamsData.push({
        code: teamCode,
        currentPlayerCount: currentCount,
        maxPlayerCount: teamCapacity,
      });
    }
    
    setTeams(teamsData);
  };

  // 保存队员信息
  const handleSave = () => {
    localStorage.setItem('tournamentPlayers', JSON.stringify(players));
    message.success('队员信息保存成功！');
    setEditingKey('');
  };

  // 更新队员姓名
  const handlePlayerNameChange = (code: string, name: string) => {
    setPlayers(prev => prev.map(p => 
      p.code === code ? { ...p, name } : p
    ));
  };

  // 删除队员（清空该位置）
  const handleDeletePlayer = (code: string) => {
    setPlayers(prev => prev.map(p => 
      p.code === code ? { ...p, name: '' } : p
    ));
    
    // 更新队伍人数
    const player = players.find(p => p.code === code);
    if (player) {
      setTeams(prev => prev.map(t => {
        if (t.code === player.teamCode) {
          return { ...t, currentPlayerCount: Math.max(0, t.currentPlayerCount - 1) };
        }
        return t;
      }));
    }
  };

  // 临时删减队伍人数
  const handleReduceTeamSize = (teamCode: string, newSize: number) => {
    if (newSize < 0) return;
    
    // 删除超出新容量的队员
    const teamPlayers = players.filter(p => p.teamCode === teamCode);
    const playersToKeep = teamPlayers.slice(0, newSize);
    const playersToRemove = teamPlayers.slice(newSize);
    
    setPlayers(prev => {
      const otherPlayers = prev.filter(p => p.teamCode !== teamCode);
      return [...otherPlayers, ...playersToKeep];
    });
    
    // 更新队伍信息
    setTeams(prev => prev.map(t => {
      if (t.code === teamCode) {
        return { ...t, currentPlayerCount: newSize };
      }
      return t;
    }));
    
    if (playersToRemove.length > 0) {
      message.info(`已删除队伍 ${teamCode} 的 ${playersToRemove.length} 名队员`);
    }
  };

  if (!tournamentConfig) {
    return (
      <Empty
        description="请先完成比赛统筹配置"
        style={{ marginTop: 100 }}
      >
        <Button type="primary" onClick={() => navigate('/tournament-setup')}>
          前往配置
        </Button>
      </Empty>
    );
  }

  const teamColumns = [
    {
      title: '队伍',
      dataIndex: 'code',
      key: 'code',
      render: (code: string) => (
        <Tag color="blue" style={{ fontSize: 16 }}>
          队伍 {code}
        </Tag>
      ),
    },
    {
      title: '当前人数',
      dataIndex: 'currentPlayerCount',
      key: 'currentPlayerCount',
      render: (count: number, record: TeamInfo) => (
        <span>{count} / {record.maxPlayerCount}</span>
      ),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: TeamInfo) => (
        <Popconfirm
          title={`调整队伍 ${record.code} 的人数`}
          description={
            <Input
              type="number"
              min={0}
              max={record.maxPlayerCount}
              defaultValue={record.currentPlayerCount}
              placeholder="输入新的队伍人数"
              id={`team-size-${record.code}`}
            />
          }
          onConfirm={() => {
            const input = document.getElementById(`team-size-${record.code}`) as HTMLInputElement;
            if (input) {
              const newSize = parseInt(input.value);
              handleReduceTeamSize(record.code, newSize);
            }
          }}
          okText="确定"
          cancelText="取消"
        >
          <Button type="link" size="small">
            调整人数
          </Button>
        </Popconfirm>
      ),
    },
  ];

  // 按队伍分组显示队员
  const renderTeamPlayers = (teamCode: string) => {
    const teamPlayers = players.filter(p => p.teamCode === teamCode);
    
    return (
      <Card
        title={
          <Space>
            <TeamOutlined />
            <span>队伍 {teamCode}</span>
          </Space>
        }
        size="small"
        style={{ marginBottom: 16 }}
      >
        <Row gutter={[8, 8]}>
          {teamPlayers.map(player => (
            <Col key={player.code} xs={24} sm={12} md={8} lg={6}>
              <Card size="small" style={{ textAlign: 'center' }}>
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Tag color="orange">{player.code}</Tag>
                  <Input
                    placeholder={`输入姓名（未填写时显示${player.code}）`}
                    value={player.name}
                    onChange={(e) => handlePlayerNameChange(player.code, e.target.value)}
                    onFocus={() => setEditingKey(player.code)}
                    size="small"
                  />
                  <div style={{ color: '#888', fontSize: 12, marginTop: 2 }}>
                    {player.name ? '' : player.code}
                  </div>
                  {player.name && (
                    <Popconfirm
                      title="确定要清空该队员吗？"
                      onConfirm={() => handleDeletePlayer(player.code)}
                      okText="确定"
                      cancelText="取消"
                    >
                      <Button type="link" danger size="small" icon={<DeleteOutlined />}>
                        清空
                      </Button>
                    </Popconfirm>
                  )}
                </Space>
              </Card>
            </Col>
          ))}
        </Row>
      </Card>
    );
  };

  return (
    <div>
      <Title level={2}>
        <TeamOutlined /> 队伍管理
      </Title>

      <Card style={{ marginBottom: 16 }}>
        <Table
          columns={teamColumns}
          dataSource={teams}
          pagination={false}
          rowKey="code"
          size="small"
        />
      </Card>

      <div style={{ marginBottom: 16 }}>
        <Button
          type="primary"
          icon={<SaveOutlined />}
          onClick={handleSave}
          disabled={!editingKey}
        >
          保存队员信息
        </Button>
      </div>

      {teams.map(team => renderTeamPlayers(team.code))}
    </div>
  );
};

export default TeamManagement; 