import React, { useState, useEffect } from 'react';
import { Card, Select, Button, Table, Tag, message, Space, Empty } from 'antd';
import { Team, Player, Formation } from '../types';
import { teamApi, playerApi, formationApi } from '../api';

const { Option } = Select;

const FormationManagement: React.FC = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<string>('');
  const [players, setPlayers] = useState<Player[]>([]);
  const [formations, setFormations] = useState<Formation[]>([]);
  const [loading, setLoading] = useState(false);

  // 阵容配置状态
  const [md1Players, setMd1Players] = useState<string[]>([]);
  const [md2Players, setMd2Players] = useState<string[]>([]);
  const [xd1Players, setXd1Players] = useState<string[]>([]);

  useEffect(() => {
    loadTeams();
  }, []);

  useEffect(() => {
    if (selectedTeam) {
      loadTeamData(selectedTeam);
    }
  }, [selectedTeam]);

  const loadTeams = async () => {
    try {
      const response = await teamApi.getAll();
      setTeams(response.data);
    } catch (error) {
      message.error('加载队伍失败');
    }
  };

  const loadTeamData = async (teamId: string) => {
    setLoading(true);
    try {
      // 加载队员
      const playersRes = await playerApi.getByTeam(teamId);
      setPlayers(playersRes.data);

      // 加载现有阵容
      const formationsRes = await formationApi.getByTeam(teamId);
      setFormations(formationsRes.data);

      // 设置现有阵容到选择器
      formationsRes.data.forEach((formation: Formation) => {
        if (formation.type === 'MD1') setMd1Players(formation.playerIds);
        else if (formation.type === 'MD2') setMd2Players(formation.playerIds);
        else if (formation.type === 'XD1') setXd1Players(formation.playerIds);
      });
    } catch (error) {
      message.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  const malePlayers = players.filter(p => p.gender === 'M');
  const femalePlayers = players.filter(p => p.gender === 'F');

  const saveFormation = async (type: 'MD1' | 'MD2' | 'XD1', playerIds: string[]) => {
    if (playerIds.length !== 2) {
      message.error('请选择2名队员');
      return;
    }

    try {
      await formationApi.create(selectedTeam, type, playerIds);
      message.success(`${getFormationName(type)}保存成功`);
      loadTeamData(selectedTeam);
    } catch (error: any) {
      message.error(error.response?.data?.error || '保存失败');
    }
  };

  const getFormationName = (type: string) => {
    switch (type) {
      case 'MD1': return '第一男双';
      case 'MD2': return '第二男双';
      case 'XD1': return '混双';
      default: return type;
    }
  };

  const renderPlayerOption = (player: Player) => (
    <Option key={player.id} value={player.id}>
      {player.name} (等级{player.skillLevel})
    </Option>
  );

  const getPlayerName = (playerId: string) => {
    const player = players.find(p => p.id === playerId);
    return player ? `${player.name} (等级${player.skillLevel})` : '';
  };

  if (!teams.length) {
    return (
      <Empty description="暂无队伍，请先创建队伍">
        <Button type="primary" href="/teams">
          去创建队伍
        </Button>
      </Empty>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Space>
          <span>选择队伍：</span>
          <Select
            style={{ width: 200 }}
            placeholder="请选择队伍"
            value={selectedTeam}
            onChange={setSelectedTeam}
          >
            {teams.map(team => (
              <Option key={team.id} value={team.id}>
                {team.name}
              </Option>
            ))}
          </Select>
        </Space>
      </div>

      {selectedTeam && (
        <div>
          <div style={{ marginBottom: 24 }}>
            <h3>队员概览</h3>
            <Space>
              <Tag color="blue">男队员: {malePlayers.length}人</Tag>
              <Tag color="pink">女队员: {femalePlayers.length}人</Tag>
              <Tag color="green">总人数: {players.length}人</Tag>
            </Space>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
            {/* 第一男双 */}
            <Card title="第一男双" loading={loading}>
              <Select
                mode="multiple"
                style={{ width: '100%' }}
                placeholder="请选择2名男队员"
                value={md1Players}
                onChange={setMd1Players}
                maxTagCount={2}
              >
                {malePlayers.map(renderPlayerOption)}
              </Select>
              <Button
                type="primary"
                style={{ marginTop: 16, width: '100%' }}
                onClick={() => saveFormation('MD1', md1Players)}
                disabled={md1Players.length !== 2}
              >
                保存第一男双
              </Button>
            </Card>

            {/* 第二男双 */}
            <Card title="第二男双" loading={loading}>
              <Select
                mode="multiple"
                style={{ width: '100%' }}
                placeholder="请选择2名男队员"
                value={md2Players}
                onChange={setMd2Players}
                maxTagCount={2}
              >
                {malePlayers.map(renderPlayerOption)}
              </Select>
              <Button
                type="primary"
                style={{ marginTop: 16, width: '100%' }}
                onClick={() => saveFormation('MD2', md2Players)}
                disabled={md2Players.length !== 2}
              >
                保存第二男双
              </Button>
            </Card>

            {/* 混双 */}
            <Card title="混双" loading={loading}>
              <Select
                mode="multiple"
                style={{ width: '100%' }}
                placeholder="请选择1男1女"
                value={xd1Players}
                onChange={setXd1Players}
                maxTagCount={2}
              >
                <Select.OptGroup label="男队员">
                  {malePlayers.map(renderPlayerOption)}
                </Select.OptGroup>
                <Select.OptGroup label="女队员">
                  {femalePlayers.map(renderPlayerOption)}
                </Select.OptGroup>
              </Select>
              <Button
                type="primary"
                style={{ marginTop: 16, width: '100%' }}
                onClick={() => saveFormation('XD1', xd1Players)}
                disabled={xd1Players.length !== 2}
              >
                保存混双
              </Button>
            </Card>
          </div>

          {/* 当前阵容 */}
          <div style={{ marginTop: 32 }}>
            <h3>当前阵容</h3>
            <Table
              dataSource={formations}
              rowKey="id"
              pagination={false}
              columns={[
                {
                  title: '项目',
                  dataIndex: 'type',
                  key: 'type',
                  render: getFormationName,
                },
                {
                  title: '队员',
                  dataIndex: 'playerIds',
                  key: 'players',
                  render: (playerIds: string[]) => (
                    <Space>
                      {playerIds.map(id => (
                        <Tag key={id}>{getPlayerName(id)}</Tag>
                      ))}
                    </Space>
                  ),
                },
              ]}
              locale={{ emptyText: '暂未配置阵容' }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default FormationManagement; 