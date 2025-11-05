import React, { useEffect, useMemo, useState } from 'react';
import {
  Table,
  Card,
  Input,
  Button,
  Space,
  message,
  Popconfirm,
  Typography,
  Tag,
  Row,
  Col,
  Empty,
  Spin,
} from 'antd';
import { TeamOutlined, SaveOutlined, DeleteOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useUserDataService } from '../hooks/useUserDataService';
import type { PlayerInfo, TournamentConfig } from '../types';

const { Title } = Typography;

interface TeamInfo {
  code: string;
  currentPlayerCount: number;
  maxPlayerCount: number;
}

const generateDefaultPlayers = (config: TournamentConfig): PlayerInfo[] => {
  const items: PlayerInfo[] = [];
  for (let i = 0; i < config.teamCount; i++) {
    const teamCode = String.fromCharCode(65 + i);
    for (let j = 1; j <= config.teamCapacity; j++) {
      items.push({
        code: `${teamCode}${j}`,
        name: '',
        teamCode,
        playerNumber: j,
      });
    }
  }
  return items;
};

const sortPlayers = (players: PlayerInfo[]) =>
  [...players].sort((a, b) => {
    if (a.teamCode === b.teamCode) {
      return a.playerNumber - b.playerNumber;
    }
    return a.teamCode.localeCompare(b.teamCode);
  });

const TeamManagement: React.FC = () => {
  const navigate = useNavigate();
  const { loadTournamentConfig, loadPlayers, savePlayers } = useUserDataService();

  const [config, setConfig] = useState<TournamentConfig | null>(null);
  const [players, setPlayers] = useState<PlayerInfo[]>([]);
  const [teams, setTeams] = useState<TeamInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const refreshTeams = (nextPlayers: PlayerInfo[], nextConfig: TournamentConfig | null) => {
    if (!nextConfig) {
      setTeams([]);
      return;
    }
    const teamInfos: TeamInfo[] = [];
    for (let i = 0; i < nextConfig.teamCount; i++) {
      const teamCode = String.fromCharCode(65 + i);
      const teamPlayers = nextPlayers.filter((p) => p.teamCode === teamCode);
      const filledCount = teamPlayers.filter((p) => p.name && p.name.trim().length > 0).length;
      teamInfos.push({
        code: teamCode,
        currentPlayerCount: filledCount,
        maxPlayerCount: nextConfig.teamCapacity,
      });
    }
    setTeams(teamInfos);
  };

  useEffect(() => {
    let active = true;
    const bootstrap = async () => {
      setLoading(true);
      try {
        const [configResult, playersResult] = await Promise.all([loadTournamentConfig(), loadPlayers()]);
        if (!active) return;
        if (!configResult.data) {
          message.warning('请先完成比赛统筹配置');
          setConfig(null);
          setPlayers([]);
          setTeams([]);
          return;
        }
        setConfig(configResult.data);
        const fetchedPlayers = playersResult.data && playersResult.data.length > 0
          ? sortPlayers(playersResult.data)
          : generateDefaultPlayers(configResult.data);
        setPlayers(fetchedPlayers);
        refreshTeams(fetchedPlayers, configResult.data);
      } catch (error) {
        if (active) {
          message.error('加载队伍配置失败，请稍后重试');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };
    bootstrap();
    return () => {
      active = false;
    };
  }, [loadTournamentConfig, loadPlayers]);

  const handleSave = async () => {
    if (!config) {
      message.warning('请先完成比赛统筹配置');
      return;
    }
    setSaving(true);
    try {
      const result = await savePlayers(players);
      if (result.error) {
        message.error(result.error.message);
      } else {
        message.success('队员信息保存成功！');
      }
    } finally {
      setSaving(false);
    }
  };

  const updatePlayers = (updater: (prev: PlayerInfo[]) => PlayerInfo[]) => {
    setPlayers((prev) => {
      const next = sortPlayers(updater(prev));
      refreshTeams(next, config);
      return next;
    });
  };

  const handlePlayerNameChange = (code: string, name: string) => {
    updatePlayers((prev) => prev.map((p) => (p.code === code ? { ...p, name } : p)));
  };

  const handleDeletePlayer = (code: string) => {
    updatePlayers((prev) => prev.map((p) => (p.code === code ? { ...p, name: '' } : p)));
  };

  const handleReduceTeamSize = (teamCode: string, newSize: number) => {
    if (!config || newSize < 0) return;
    updatePlayers((prev) => {
      const others = prev.filter((p) => p.teamCode !== teamCode);
      const currentTeam = prev
        .filter((p) => p.teamCode === teamCode)
        .slice(0, newSize)
        .map((p) => ({ ...p, name: p.name }));
      if (currentTeam.length < newSize) {
        for (let i = currentTeam.length + 1; i <= newSize; i++) {
          currentTeam.push({
            code: `${teamCode}${i}`,
            name: '',
            teamCode,
            playerNumber: i,
          });
        }
      }
      if (newSize < config.teamCapacity) {
        message.info(`已删除队伍 ${teamCode} 的 ${config.teamCapacity - newSize} 名队员`);
      }
      return [...others, ...currentTeam];
    });
  };

  const teamColumns = useMemo(
    () => [
      {
        title: '队伍',
        dataIndex: 'code',
        key: 'code',
      },
      {
        title: '已登记人数',
        dataIndex: 'currentPlayerCount',
        key: 'currentPlayerCount',
        render: (count: number, record: TeamInfo) => (
          <span>
            {count} / {record.maxPlayerCount}
          </span>
        ),
      },
      {
        title: '操作',
        key: 'action',
        render: (_: unknown, record: TeamInfo) => (
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
              const input = document.getElementById(`team-size-${record.code}`) as HTMLInputElement | null;
              if (input) {
                const newSize = parseInt(input.value, 10);
                handleReduceTeamSize(record.code, Number.isNaN(newSize) ? record.currentPlayerCount : newSize);
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
    ],
    []
  );

  if (!config && !loading) {
    return (
      <Empty
        description="请先完成比赛统筹配置"
        style={{ marginTop: 100 }}
        image={Empty.PRESENTED_IMAGE_SIMPLE}
      >
        <Button type="primary" onClick={() => navigate('/tournament-setup')}>
          前往配置
        </Button>
      </Empty>
    );
  }

  const renderTeamPlayers = (teamCode: string) => {
    const teamPlayers = players.filter((p) => p.teamCode === teamCode);
    return (
      <Card
        key={teamCode}
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
          {teamPlayers.map((player) => (
            <Col key={player.code} xs={24} sm={12} md={8} lg={6}>
              <Card size="small" style={{ textAlign: 'center' }}>
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Tag color="orange">{player.code}</Tag>
                  <Input
                    placeholder={`输入姓名（未填写时显示${player.code}）`}
                    value={player.name}
                    onChange={(e) => handlePlayerNameChange(player.code, e.target.value)}
                    size="small"
                  />
                  <div style={{ color: '#888', fontSize: 12, marginTop: 2 }}>{player.name ? '' : player.code}</div>
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

      <Spin spinning={loading}>
        <Card style={{ marginBottom: 16 }}>
          <Table
            columns={teamColumns}
            dataSource={teams}
            pagination={false}
            rowKey="code"
            size="small"
            scroll={{ x: 'max-content' }}
          />
        </Card>

        <div style={{ marginBottom: 16 }}>
          <Space>
            <Button type="primary" icon={<SaveOutlined />} onClick={handleSave} disabled={!config} loading={saving}>
              保存队员信息
            </Button>
            <Button onClick={() => navigate('/formations')} disabled={!config}>
              前往阵容配置
            </Button>
          </Space>
        </div>

        {config &&
          Array.from({ length: config.teamCount }, (_, index) => String.fromCharCode(65 + index)).map((teamCode) =>
            renderTeamPlayers(teamCode)
          )}
      </Spin>
    </div>
  );
};

export default TeamManagement;
