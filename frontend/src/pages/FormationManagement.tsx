import React, { useEffect, useMemo, useState } from 'react';
import {
  Card,
  Select,
  Button,
  Table,
  Tag,
  message,
  Space,
  Empty,
  Row,
  Col,
  Typography,
  Alert,
  Spin,
} from 'antd';
import { TeamOutlined, SettingOutlined, UserOutlined, SaveOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useUserDataService } from '../hooks/useUserDataService';
import type { FormationConfig, PlayerInfo, TournamentConfig } from '../types';

const { Title, Text } = Typography;
const { Option } = Select;
const { Column } = Table;

const sortPlayers = (players: PlayerInfo[]) =>
  [...players].sort((a, b) => {
    if (a.teamCode === b.teamCode) {
      return a.playerNumber - b.playerNumber;
    }
    return a.teamCode.localeCompare(b.teamCode);
  });

const buildDefaultFormations = (
  teamCode: string,
  config: TournamentConfig,
  teamPlayers: PlayerInfo[]
): Record<string, string[]> => {
  const map: Record<string, string[]> = {};
  config.formations.forEach((formation) => {
    const numbers = formation.split('+').map((n) => parseInt(n, 10));
    const codes = numbers
      .map((num) => teamPlayers.find((player) => player.playerNumber === num)?.code ?? `${teamCode}${num}`);
    map[formation] = codes.slice(0, 2);
  });
  return map;
};

const FormationManagement: React.FC = () => {
  const navigate = useNavigate();
  const { loadTournamentConfig, loadPlayers, loadFormations, saveFormations } = useUserDataService();

  const [config, setConfig] = useState<TournamentConfig | null>(null);
  const [players, setPlayers] = useState<PlayerInfo[]>([]);
  const [formationConfigs, setFormationConfigs] = useState<FormationConfig[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<string>('');
  const [currentFormations, setCurrentFormations] = useState<Record<string, string[]>>({});
  const [initialLoading, setInitialLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    const bootstrap = async () => {
      setInitialLoading(true);
      try {
        const [configResult, playersResult, formationsResult] = await Promise.all([
          loadTournamentConfig(),
          loadPlayers(),
          loadFormations(),
        ]);

        if (!active) return;

        if (!configResult.data) {
          message.warning('请先完成比赛统筹配置');
          setConfig(null);
          setPlayers([]);
          setFormationConfigs([]);
          setSelectedTeam('');
          return;
        }

        const sortedPlayers = sortPlayers(playersResult.data ?? []);

        setConfig(configResult.data);
        setPlayers(sortedPlayers);
        setFormationConfigs(formationsResult.data ?? []);

        if (configResult.data.teamCount > 0) {
          const firstTeam = String.fromCharCode(65);
          setSelectedTeam((prev) => (prev ? prev : firstTeam));
        }
      } catch (error) {
        if (active) {
          console.error(error);
          message.error('加载阵容数据失败，请稍后重试');
        }
      } finally {
        if (active) {
          setInitialLoading(false);
        }
      }
    };

    void bootstrap();
    return () => {
      active = false;
    };
  }, [loadTournamentConfig, loadPlayers, loadFormations]);

  useEffect(() => {
    if (!selectedTeam || !config) {
      setCurrentFormations({});
      return;
    }

    const existing = formationConfigs.find((item) => item.teamCode === selectedTeam);
    if (existing) {
      setCurrentFormations(existing.formations);
      return;
    }

    const teamPlayers = players.filter((player) => player.teamCode === selectedTeam);
    setCurrentFormations(buildDefaultFormations(selectedTeam, config, teamPlayers));
  }, [selectedTeam, config, formationConfigs, players]);

  const teamOptions = useMemo(() => {
    if (!config) return [];
    return Array.from({ length: config.teamCount }, (_, index) => String.fromCharCode(65 + index));
  }, [config]);

  const configuredTeamsCount = useMemo(() => formationConfigs.length, [formationConfigs]);

  const getTeamPlayers = (teamCode: string) =>
    players.filter((player) => player.teamCode === teamCode);

  const getTeamCompletedFormations = (teamCode: string) => {
    const entry = formationConfigs.find((item) => item.teamCode === teamCode);
    if (!entry || !config) return 0;
    return config.formations.reduce((count, formation) => {
      const selected = entry.formations[formation];
      return selected && selected.length === 2 ? count + 1 : count;
    }, 0);
  };

  const getPlayerDisplay = (playerCode: string) => {
    const player = players.find((item) => item.code === playerCode);
    if (!player) return playerCode;
    return player.name ? `${playerCode} - ${player.name}` : playerCode;
  };

  const handleSave = async () => {
    if (!config) {
      message.warning('请先完成比赛统筹配置');
      return;
    }
    if (!selectedTeam) {
      message.error('请先选择队伍');
      return;
    }

    for (const formation of config.formations) {
      const selected = currentFormations[formation] ?? [];
      if (selected.length !== 2) {
        message.error(`${formation} 必须选择2名队员`);
        return;
      }
    }

    const nextConfigs = (() => {
      const updated = formationConfigs.filter((item) => item.teamCode !== selectedTeam);
      return [...updated, { teamCode: selectedTeam, formations: currentFormations }];
    })();

    setSaving(true);
    try {
      const result = await saveFormations(nextConfigs);
      if (result.error) {
        message.error(result.error.message);
        return;
      }
      setFormationConfigs(nextConfigs);
      message.success('阵容保存成功！');
    } catch (error) {
      console.error(error);
      message.error('保存阵容失败，请稍后重试');
    } finally {
      setSaving(false);
    }
  };

  const autoGenerateAllFormations = async () => {
    if (!config) {
      message.warning('请先完成比赛统筹配置');
      return;
    }
    if (players.length === 0) {
      message.warning('请先在队伍管理中初始化队员');
      return;
    }

    const generated: FormationConfig[] = teamOptions.map((teamCode) => {
      const teamPlayers = getTeamPlayers(teamCode);
      return {
        teamCode,
        formations: buildDefaultFormations(teamCode, config, teamPlayers),
      };
    });

    setSaving(true);
    try {
      const result = await saveFormations(generated);
      if (result.error) {
        message.error(result.error.message);
        return;
      }
      setFormationConfigs(generated);
      if (selectedTeam) {
        const entry = generated.find((item) => item.teamCode === selectedTeam);
        if (entry) {
          setCurrentFormations(entry.formations);
        }
      }
      message.success('已为所有队伍自动生成阵容');
    } catch (error) {
      console.error(error);
      message.error('自动生成阵容失败，请稍后重试');
    } finally {
      setSaving(false);
    }
  };

  if (initialLoading) {
    return (
      <div style={{ padding: '48px 0', display: 'flex', justifyContent: 'center' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!config) {
    return (
      <Empty
        description="请先完成比赛统筹配置"
        style={{ marginTop: 100 }}
        image={Empty.PRESENTED_IMAGE_SIMPLE}
      >
        <Button type="primary" onClick={() => navigate('/tournament-setup')}>
          前往比赛统筹
        </Button>
      </Empty>
    );
  }

  if (players.length === 0) {
    return (
      <Empty
        description="尚未配置队员，请先在队伍管理中完成队员设置"
        style={{ marginTop: 100 }}
        image={Empty.PRESENTED_IMAGE_SIMPLE}
      >
        <Button type="primary" onClick={() => navigate('/teams')}>
          前往队伍管理
        </Button>
      </Empty>
    );
  }

  const teamPlayers = selectedTeam ? getTeamPlayers(selectedTeam) : [];

  return (
    <div>
      <Title level={2}>
        <TeamOutlined /> 阵容配置
      </Title>

      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16} align="middle">
          <Col span={8}>
            <Space direction="vertical">
              <Text>选择队伍</Text>
              <Select
                value={selectedTeam || undefined}
                placeholder="选择队伍"
                style={{ minWidth: 160 }}
                onChange={(value) => setSelectedTeam(value)}
              >
                {teamOptions.map((team) => {
                  const completed = getTeamCompletedFormations(team);
                  return (
                    <Option key={team} value={team}>
                      队伍 {team} {completed}/{config.formations.length}
                    </Option>
                  );
                })}
              </Select>
            </Space>
          </Col>
          <Col span={8}>
            <Space>
              <Text>已配置队伍：</Text>
              <Tag color={configuredTeamsCount === config.teamCount ? 'green' : 'blue'}>
                {configuredTeamsCount}/{config.teamCount}
              </Tag>
            </Space>
          </Col>
          <Col span={8} style={{ textAlign: 'right' }}>
            <Space>
              <Button type="default" icon={<SettingOutlined />} onClick={autoGenerateAllFormations} loading={saving}>
                自动生成阵容
              </Button>
              <Button
                type="primary"
                icon={<SaveOutlined />}
                onClick={handleSave}
                disabled={!selectedTeam}
                loading={saving}
              >
                保存阵容
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {selectedTeam && teamPlayers.length === 0 && (
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
          message={`队伍 ${selectedTeam} 尚未配置队员，请前往队伍管理补充。`}
        />
      )}

      {selectedTeam && (
        <Card title={`队伍 ${selectedTeam} 阵容配置`}>
          <Table
            dataSource={config.formations.map((formation) => ({
              key: formation,
              formation,
              players: currentFormations[formation] || [],
            }))}
            pagination={false}
            rowKey="formation"
            scroll={{ x: 'max-content' }}
          >
            <Column
              title="比赛项目"
              dataIndex="formation"
              key="formation"
              render={(formation: string) => (
                <Tag color="blue" style={{ fontSize: 16 }}>
                  {formation}
                </Tag>
              )}
            />
            <Column
              title="选择队员"
              dataIndex="players"
              key="players"
              render={(playersValue: string[], record: { formation: string }) => (
                <Select
                  mode="multiple"
                  style={{ width: '100%' }}
                  placeholder="选择2名队员"
                  value={playersValue}
                  onChange={(values) =>
                    setCurrentFormations((prev) => ({
                      ...prev,
                      [record.formation]: values.slice(0, 2),
                    }))
                  }
                  optionLabelProp="label"
                >
                  {teamPlayers.map((player) => (
                    <Option key={player.code} value={player.code} label={player.code}>
                      <Space>
                        <UserOutlined />
                        <span>{player.name ? `${player.code} - ${player.name}` : player.code}</span>
                      </Space>
                    </Option>
                  ))}
                </Select>
              )}
            />
            <Column
              title="已选队员"
              key="selectedPlayers"
              render={(_: unknown, record: { players: string[] }) => (
                <Space direction="vertical" style={{ width: '100%' }}>
                  {record.players.map((code) => (
                    <Tag key={code} color="orange">
                      {getPlayerDisplay(code)}
                    </Tag>
                  ))}
                </Space>
              )}
            />
          </Table>
        </Card>
      )}
    </div>
  );
};

export default FormationManagement;
