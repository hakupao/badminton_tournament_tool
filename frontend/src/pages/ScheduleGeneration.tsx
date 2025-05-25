import React, { useState, useEffect } from 'react';
import { Button, InputNumber, Card, Space, message, Alert, Spin, Empty, Result } from 'antd';
import { ScheduleOutlined, ReloadOutlined } from '@ant-design/icons';
import { scheduleApi, teamApi, formationApi } from '../api';
import { Team } from '../types';

const ScheduleGeneration: React.FC = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [courtsCount, setCourtsCount] = useState(4);
  const [loading, setLoading] = useState(false);
  const [checkingFormations, setCheckingFormations] = useState(false);
  const [formationStatus, setFormationStatus] = useState<{
    ready: boolean;
    missingFormations: { teamName: string; missing: string[] }[];
  }>({ ready: false, missingFormations: [] });
  const [scheduleInfo, setScheduleInfo] = useState<{
    matchesCount: number;
    totalTimeSlots: number;
    totalRounds: number;
  } | null>(null);

  useEffect(() => {
    checkReadiness();
  }, []);

  const checkReadiness = async () => {
    setCheckingFormations(true);
    try {
      // 获取所有队伍
      const teamsRes = await teamApi.getAll();
      const teamsData = teamsRes.data;
      setTeams(teamsData);

      // 检查每个队伍的阵容配置
      const missingFormations: { teamName: string; missing: string[] }[] = [];
      const requiredTypes = ['MD1', 'MD2', 'XD1'];

      for (const team of teamsData) {
        const formationsRes = await formationApi.getByTeam(team.id);
        const configuredTypes = formationsRes.data.map(f => f.type);
        const missing = requiredTypes.filter(type => !configuredTypes.includes(type));
        
        if (missing.length > 0) {
          missingFormations.push({
            teamName: team.name,
            missing: missing.map(type => {
              switch (type) {
                case 'MD1': return '第一男双';
                case 'MD2': return '第二男双';
                case 'XD1': return '混双';
                default: return type;
              }
            }),
          });
        }
      }

      setFormationStatus({
        ready: missingFormations.length === 0 && teamsData.length >= 2,
        missingFormations,
      });
    } catch (error) {
      message.error('检查队伍状态失败');
    } finally {
      setCheckingFormations(false);
    }
  };

  const generateSchedule = async () => {
    setLoading(true);
    try {
      const response = await scheduleApi.generate(courtsCount);
      const data = response.data;
      
      setScheduleInfo({
        matchesCount: data.matchesCount,
        totalTimeSlots: data.totalTimeSlots,
        totalRounds: data.totalRounds,
      });
      
      message.success('赛程生成成功！');
    } catch (error: any) {
      message.error(error.response?.data?.error || '赛程生成失败');
    } finally {
      setLoading(false);
    }
  };

  if (checkingFormations) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0' }}>
        <Spin size="large" />
        <div style={{ marginTop: 16 }}>正在检查队伍和阵容配置...</div>
      </div>
    );
  }

  if (teams.length === 0) {
    return (
      <Empty description="暂无队伍">
        <Button type="primary" href="/teams">
          去创建队伍
        </Button>
      </Empty>
    );
  }

  if (teams.length < 2) {
    return (
      <Alert
        message="队伍数量不足"
        description="至少需要2支队伍才能生成赛程，请先创建更多队伍。"
        type="warning"
        showIcon
        action={
          <Button type="primary" href="/teams">
            去创建队伍
          </Button>
        }
      />
    );
  }

  return (
    <div>
      <Card title="赛程生成" style={{ marginBottom: 24 }}>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          {/* 队伍状态检查 */}
          <div>
            <h4>队伍状态</h4>
            {formationStatus.ready ? (
              <Alert
                message="所有队伍已准备就绪"
                description={`共有 ${teams.length} 支队伍参赛，所有队伍都已配置完整阵容。`}
                type="success"
                showIcon
              />
            ) : (
              <Alert
                message="部分队伍阵容未配置完整"
                description={
                  <div>
                    <p>请先为以下队伍配置完整阵容：</p>
                    <ul>
                      {formationStatus.missingFormations.map((item, index) => (
                        <li key={index}>
                          <strong>{item.teamName}</strong>：缺少 {item.missing.join('、')}
                        </li>
                      ))}
                    </ul>
                  </div>
                }
                type="error"
                showIcon
                action={
                  <Button type="primary" href="/formations">
                    去配置阵容
                  </Button>
                }
              />
            )}
          </div>

          {/* 参数设置 */}
          <div>
            <h4>赛程参数</h4>
            <Space>
              <span>可用场地数量：</span>
              <InputNumber
                min={1}
                max={10}
                value={courtsCount}
                onChange={(value) => setCourtsCount(value || 4)}
                disabled={!formationStatus.ready}
              />
              <span>个</span>
            </Space>
          </div>

          {/* 生成按钮 */}
          <div>
            <Space>
              <Button
                type="primary"
                size="large"
                icon={<ScheduleOutlined />}
                onClick={generateSchedule}
                loading={loading}
                disabled={!formationStatus.ready}
              >
                生成赛程
              </Button>
              <Button
                icon={<ReloadOutlined />}
                onClick={checkReadiness}
                disabled={loading}
              >
                刷新状态
              </Button>
            </Space>
          </div>
        </Space>
      </Card>

      {/* 生成结果 */}
      {scheduleInfo && (
        <Card title="生成结果">
          <Result
            status="success"
            title="赛程生成成功！"
            subTitle={
              <Space direction="vertical">
                <div>共生成 {scheduleInfo.matchesCount} 场比赛</div>
                <div>需要 {scheduleInfo.totalTimeSlots} 个时间段</div>
                <div>共计 {scheduleInfo.totalRounds} 轮次</div>
              </Space>
            }
            extra={[
              <Button type="primary" key="view" href="/matches">
                查看比赛列表
              </Button>,
              <Button key="regenerate" onClick={generateSchedule}>
                重新生成
              </Button>,
            ]}
          />
        </Card>
      )}
    </div>
  );
};

export default ScheduleGeneration; 