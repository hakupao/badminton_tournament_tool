import React, { useState, useEffect } from 'react';
import { Card, Select, Button, Table, Tag, message, Space, Empty, Row, Col, Typography, Alert } from 'antd';
import { TeamOutlined, SettingOutlined, UserOutlined, SaveOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;
const { Option } = Select;

interface PlayerInfo {
  code: string;
  name: string;
  teamCode: string;
  playerNumber: number;
}

interface FormationConfig {
  teamCode: string;
  formations: { [key: string]: string[] }; // key是阵容组合(如"1+2"), value是选中的队员代号
}

const FormationManagement: React.FC = () => {
  const [tournamentConfig, setTournamentConfig] = useState<any>(null);
  const [players, setPlayers] = useState<PlayerInfo[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<string>('');
  const [formationConfigs, setFormationConfigs] = useState<FormationConfig[]>([]);
  const [currentFormations, setCurrentFormations] = useState<{ [key: string]: string[] }>({});
  const navigate = useNavigate();

  // 加载配置
  useEffect(() => {
    const savedConfig = localStorage.getItem('tournamentConfig');
    const savedPlayers = localStorage.getItem('tournamentPlayers');
    const savedFormations = localStorage.getItem('tournamentFormations');
    
    if (savedConfig && savedPlayers) {
      const config = JSON.parse(savedConfig);
      const playersData = JSON.parse(savedPlayers);
      
      setTournamentConfig(config);
      setPlayers(playersData);
      
      if (savedFormations) {
        setFormationConfigs(JSON.parse(savedFormations));
      }
    } else {
      message.warning('请先完成比赛统筹和队伍管理配置');
    }
  }, []);

  // 加载选中队伍的阵容
  useEffect(() => {
    if (selectedTeam && tournamentConfig) {
      const teamFormation = formationConfigs.find(f => f.teamCode === selectedTeam);
      if (teamFormation) {
        setCurrentFormations(teamFormation.formations);
      } else {
        // 初始化空阵容，并自动填充默认组合
        const emptyFormations: { [key: string]: string[] } = {};
        tournamentConfig?.formations?.forEach((f: string) => {
          // 解析如1+2
          const nums = f.split('+').map(n => parseInt(n));
          // 找到该队的对应号码队员
          const code1 = `${selectedTeam}${nums[0]}`;
          const code2 = `${selectedTeam}${nums[1]}`;
          emptyFormations[f] = [code1, code2];
        });
        setCurrentFormations(emptyFormations);
      }
    }
  }, [selectedTeam, formationConfigs, tournamentConfig]);

  // 保存阵容配置
  const saveFormations = () => {
    if (!selectedTeam) {
      message.error('请先选择队伍');
      return;
    }

    // 验证每个阵容都选择了正确数量的队员
    for (const [formation, playerCodes] of Object.entries(currentFormations)) {
      if (playerCodes.length !== 2) {
        message.error(`${formation} 必须选择2名队员`);
        return;
      }
    }

    // 更新或添加阵容配置
    const updatedConfigs = [...formationConfigs];
    const existingIndex = updatedConfigs.findIndex(f => f.teamCode === selectedTeam);
    
    if (existingIndex >= 0) {
      updatedConfigs[existingIndex].formations = currentFormations;
    } else {
      updatedConfigs.push({
        teamCode: selectedTeam,
        formations: currentFormations
      });
    }

    setFormationConfigs(updatedConfigs);
    localStorage.setItem('tournamentFormations', JSON.stringify(updatedConfigs));
    message.success('阵容保存成功！');
  };

  // 获取队伍的可用队员
  const getTeamPlayers = (teamCode: string) => {
    return players.filter(p => p.teamCode === teamCode);
  };

  // 处理阵容选择变化
  const handleFormationChange = (formation: string, selectedCodes: string[]) => {
    setCurrentFormations(prev => ({
      ...prev,
      [formation]: selectedCodes
    }));
  };

  // 获取队员显示名称
  const getPlayerDisplay = (playerCode: string) => {
    const player = players.find(p => p.code === playerCode);
    if (player) {
      return player.name ? `${playerCode} - ${player.name}` : playerCode;
    }
    return playerCode;
  };

  // 获取队伍已完成的阵容数
  const getTeamCompletedFormations = (teamCode: string) => {
    const teamFormation = formationConfigs.find(f => f.teamCode === teamCode);
    if (!teamFormation) return 0;
    
    return Object.values(teamFormation.formations).filter(f => f.length === 2).length;
  };

  // 自动生成并保存所有队伍的阵容
  const autoGenerateAllFormations = () => {
    if (!tournamentConfig) return;
    
    const newFormations: FormationConfig[] = [];
    
    // 为每个队伍生成默认阵容
    for (let i = 0; i < tournamentConfig.teamCount; i++) {
      const teamCode = String.fromCharCode(65 + i);
      const formations: { [key: string]: string[] } = {};
      
      // 为每个比赛项目生成默认阵容
      tournamentConfig.formations.forEach((f: string) => {
        const nums = f.split('+').map(n => parseInt(n));
        const code1 = `${teamCode}${nums[0]}`;
        const code2 = `${teamCode}${nums[1]}`;
        formations[f] = [code1, code2];
      });
      
      newFormations.push({
        teamCode,
        formations
      });
    }
    
    setFormationConfigs(newFormations);
    localStorage.setItem('tournamentFormations', JSON.stringify(newFormations));
    message.success('已自动生成并保存所有队伍的默认阵容！');
  };

  if (!tournamentConfig || !players.length) {
    return (
      <Empty
        description="请先完成比赛统筹和队伍管理配置"
        style={{ marginTop: 100 }}
      >
        <Space>
          <Button type="primary" onClick={() => navigate('/tournament-setup')}>
            比赛统筹
          </Button>
          <Button onClick={() => navigate('/teams')}>
            队伍管理
          </Button>
        </Space>
      </Empty>
    );
  }

  // 生成队伍选项
  const teamOptions = [];
  for (let i = 0; i < tournamentConfig.teamCount; i++) {
    const teamCode = String.fromCharCode(65 + i);
    teamOptions.push(teamCode);
  }

  // 统计已配置的队伍数
  const configuredTeamsCount = formationConfigs.filter(config => 
    Object.values(config.formations).every(f => f.length === 2)
  ).length;

  return (
    <div>
      <Title level={2}>
        <SettingOutlined /> 阵容配置
      </Title>

      <Alert
        message="配置说明"
        description={`根据比赛统筹中设置的 ${tournamentConfig.formations.length} 个比赛项目（${tournamentConfig.formations.join('、')}），为每个队伍配置具体的参赛队员。每个阵容位置需要选择2名队员。`}
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />

      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={8}>
            <Space>
              <TeamOutlined />
              <Text strong>选择队伍：</Text>
              <Select
                style={{ width: 120 }}
                placeholder="选择队伍"
                value={selectedTeam}
                onChange={(value) => {
                  setSelectedTeam(value);
                  // 检查是否有已保存的阵容
                  const hasFormation = formationConfigs.some(f => f.teamCode === value);
                  if (!hasFormation && tournamentConfig) {
                    // 自动生成默认阵容
                    const defaultFormations: { [key: string]: string[] } = {};
                    tournamentConfig.formations.forEach((f: string) => {
                      const nums = f.split('+').map(n => parseInt(n));
                      const code1 = `${value}${nums[0]}`;
                      const code2 = `${value}${nums[1]}`;
                      defaultFormations[f] = [code1, code2];
                    });
                    setCurrentFormations(defaultFormations);
                  }
                }}
              >
                {teamOptions.map(team => {
                  const completed = getTeamCompletedFormations(team);
                  const total = tournamentConfig.formations.length;
                  return (
                    <Option key={team} value={team}>
                      队伍 {team} {completed}/{total}
                    </Option>
                  );
                })}
              </Select>
            </Space>
          </Col>
          <Col span={8}>
            <Space>
              <Text>已配置: </Text>
              <Tag color="success">{configuredTeamsCount}/{tournamentConfig.teamCount} 队伍</Tag>
            </Space>
          </Col>
          <Col span={8} style={{ textAlign: 'right' }}>
            <Space>
              <Button 
                type="default" 
                icon={<SettingOutlined />} 
                onClick={autoGenerateAllFormations}
              >
                自动生成阵容
              </Button>
              <Button 
                type="primary" 
                icon={<SaveOutlined />} 
                onClick={saveFormations}
                disabled={!selectedTeam}
              >
                保存阵容
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {selectedTeam && (
        <Card title={`队伍 ${selectedTeam} 阵容配置`}>
          <Table
            dataSource={tournamentConfig.formations.map((formation: string) => ({
              key: formation,
              formation,
              players: currentFormations[formation] || [],
            }))}
            pagination={false}
            rowKey="formation"
            scroll={{ x: 'max-content' }}
          >
            <Table.Column
              title="比赛项目"
              dataIndex="formation"
              key="formation"
              render={(formation: string) => (
                <Tag color="blue" style={{ fontSize: 16 }}>
                  {formation}
                </Tag>
              )}
            />
            <Table.Column
              title="选择队员"
              dataIndex="players"
              key="players"
              render={(players: string[], record: any) => {
                const teamPlayers = getTeamPlayers(selectedTeam);
                return (
                  <Select
                    mode="multiple"
                    style={{ width: '100%' }}
                    placeholder="选择2名队员"
                    value={players}
                    onChange={(values) => handleFormationChange(record.formation, values)}
                    optionLabelProp="label"
                  >
                    {teamPlayers.map(player => (
                      <Option key={player.code} value={player.code} label={player.code}>
                        <Space>
                          <UserOutlined />
                          <span>{player.code}{player.name ? ` - ${player.name}` : ''}</span>
                        </Space>
                      </Option>
                    ))}
                  </Select>
                );
              }}
            />
            <Table.Column
              title="已选队员"
              key="selectedPlayers"
              render={(_: any, record: any) => (
                <Space direction="vertical" style={{ width: '100%' }}>
                  {record.players.map((code: string) => (
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
