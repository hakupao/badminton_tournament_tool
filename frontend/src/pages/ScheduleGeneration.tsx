import React, { useState, useEffect } from 'react';
import { Button, Card, Space, message, Alert, Table, Result, Tag, Row, Col, Typography } from 'antd';
import { ScheduleOutlined, CheckCircleOutlined, CloseCircleOutlined, PlayCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAppState } from '../store';

const { Title, Text } = Typography;

// 补充缺失的类型定义
interface PlayerInfo {
  code: string;
  name: string;
  teamCode: string;
  playerNumber: number;
}

interface FormationConfig {
  teamCode: string;
  formations: { [key: string]: string[] };
}

interface MatchSchedule {
  timeSlot: number;
  court: number;
  teamA: string;
  teamB: string;
  formation: string;
  teamAPlayers: string[];
  teamBPlayers: string[];
}

const ScheduleGeneration: React.FC = () => {
  const { setMatches, setTimeSlots } = useAppState();
  const [tournamentConfig, setTournamentConfig] = useState<any>(null);
  const [schedule, setSchedule] = useState<MatchSchedule[]>([]);
  const [loading, setLoading] = useState(false);
  const [readyStatus, setReadyStatus] = useState<{
    configReady: boolean;
    formationsReady: boolean;
    missingTeams: string[];
  }>({ configReady: false, formationsReady: false, missingTeams: [] });
  const navigate = useNavigate();

  // 加载配置
  useEffect(() => {
    checkReadiness();
  }, []);

  const checkReadiness = () => {
    const savedConfig = localStorage.getItem('tournamentConfig');
    const savedFormations = localStorage.getItem('tournamentFormations');
    
    if (savedConfig) {
      const config = JSON.parse(savedConfig);
      setTournamentConfig(config);
      
      if (savedFormations) {
        const formations = JSON.parse(savedFormations);
        
        // 检查哪些队伍还没有配置阵容
        const missingTeams: string[] = [];
        for (let i = 0; i < config.teamCount; i++) {
          const teamCode = String.fromCharCode(65 + i);
          if (!formations.find((f: any) => f.teamCode === teamCode)) {
            missingTeams.push(teamCode);
          }
        }
        
        setReadyStatus({
          configReady: true,
          formationsReady: missingTeams.length === 0,
          missingTeams
        });
      } else {
        setReadyStatus({
          configReady: true,
          formationsReady: false,
          missingTeams: Array.from({ length: config.teamCount }, (_, i) => 
            String.fromCharCode(65 + i)
          )
        });
      }
    } else {
      setReadyStatus({
        configReady: false,
        formationsReady: false,
        missingTeams: []
      });
    }
  };

  // 生成智能循环赛赛程（以个人为单位）
  const generateSchedule = () => {
    if (!tournamentConfig || !readyStatus.formationsReady) {
      message.error('请先完成所有配置');
      return;
    }

    setLoading(true);
    try {
      const { teamCount, formations, courtCount } = tournamentConfig;
      const teams = Array.from({ length: teamCount }, (_, i) => String.fromCharCode(65 + i));
      // 获取所有队员信息
      const players: PlayerInfo[] = JSON.parse(localStorage.getItem('tournamentPlayers') || '[]');
      // 获取所有阵容配置
      const formationConfigs: FormationConfig[] = JSON.parse(localStorage.getItem('tournamentFormations') || '[]');

      // 1. 生成所有比赛任务（每个团体对阵的每个阵容，包含4名队员code）
      interface Task {
        teamA: string;
        teamB: string;
        formation: string;
        teamAPlayers: string[]; // code
        teamBPlayers: string[]; // code
      }
      
      const tasks: Task[] = [];
      for (let i = 0; i < teams.length; i++) {
        for (let j = i + 1; j < teams.length; j++) {
          const teamA = teams[i];
          const teamB = teams[j];
          const teamAFormation = formationConfigs.find(f => f.teamCode === teamA)?.formations || {};
          const teamBFormation = formationConfigs.find(f => f.teamCode === teamB)?.formations || {};
          
          formations.forEach((formation: string) => {
            tasks.push({
              teamA,
              teamB,
              formation,
              teamAPlayers: teamAFormation[formation] || [],
              teamBPlayers: teamBFormation[formation] || [],
            });
          });
        }
      }

      // 2. 初始化每个人的出场记录
      const playerLastSlot: Record<string, number> = {};
      players.forEach(p => { playerLastSlot[p.code] = -2; }); // -2表示未出场
      const playerSlotHistory: Record<string, number[]> = {};
      players.forEach(p => { playerSlotHistory[p.code] = []; });
      
      // 计算休息时间
      const getRestingSlots = (playerCode: string, currentSlot: number): number => {
        const history = playerSlotHistory[playerCode];
        if (!history || history.length === 0) return currentSlot + 2; // 未参赛过，返回一个较大值
        return currentSlot - history[history.length - 1];
      };

      // 检查选手是否会连续参赛多场
      const checkConsecutiveMatches = (playerCode: string, currentSlot: number): number => {
        const history = playerSlotHistory[playerCode];
        if (!history || history.length < 2) return 1; // 参赛少于2场，返回1
        
        // 检查历史记录中最近的时间段
        let consecutiveCount = 1;
        for (let i = history.length - 1; i > 0; i--) {
          // 如果发现不连续的时间段，终止计数
          if (history[i] - history[i-1] !== 1) break;
          consecutiveCount++;
        }
        
        // 如果当前时间段与最近一次参赛连续，则计数+1
        if (history[history.length - 1] === currentSlot - 1) {
          return consecutiveCount + 1;
        }
        
        return 1; // 不连续则返回1
      };

      // 3. 贪心调度
      const scheduleResult: MatchSchedule[] = [];
      let slot = 1;
      let remainTasks = [...tasks];
      
      while (remainTasks.length > 0) {
        // 本时间段可安排的比赛
        const slotMatches: MatchSchedule[] = [];
        const usedPlayers = new Set<string>();
        
        // 重复尝试分配，直到无法为任何场地分配比赛
        let canAllocateMore = true;
        while(canAllocateMore) {
          canAllocateMore = false;
          // 尝试为每个场地分配比赛
          for (let c = 1; c <= courtCount; c++) {
            // 跳过已分配的场地
            if (slotMatches.some(match => match.court === c)) continue;
            
            // 优先级1: 找到所有队员都未在本时间段出场的比赛
            let available = remainTasks.filter(task =>
              [...task.teamAPlayers, ...task.teamBPlayers].every(code => !usedPlayers.has(code))
            );
            
            if (available.length === 0) continue;
            
            // 硬性限制: 过滤掉会导致选手连续四场比赛的任务
            available = available.filter(task => {
              return [...task.teamAPlayers, ...task.teamBPlayers].every(code => {
                const consecutiveCount = checkConsecutiveMatches(code, slot);
                return consecutiveCount < 4; // 排除会导致连续四场比赛的任务
              });
            });
            
            if (available.length === 0) continue; // 如果没有符合条件的任务，跳过此场地
            
            // 排序规则: 优先避免连续三场比赛，其次避免连续两场，再考虑休息时间
            available.sort((a, b) => {
              const aPlayers = [...a.teamAPlayers, ...a.teamBPlayers];
              const bPlayers = [...b.teamAPlayers, ...b.teamBPlayers];
              
              // 检查是否有连续三场比赛的选手
              const aHasThreeConsecutive = aPlayers.some(code => checkConsecutiveMatches(code, slot) >= 3);
              const bHasThreeConsecutive = bPlayers.some(code => checkConsecutiveMatches(code, slot) >= 3);
              
              // 连续三场比赛判断 - 优先级最高
              if (aHasThreeConsecutive && !bHasThreeConsecutive) return 1; // b优先
              if (!aHasThreeConsecutive && bHasThreeConsecutive) return -1; // a优先
              
              // 连续两场比赛的惩罚值
              const aContinuousPenalty = aPlayers.reduce((sum, code) => {
                const lastSlot = playerLastSlot[code];
                return sum + (lastSlot === slot - 1 ? 1000 : 0); // 大惩罚值
              }, 0);
              
              const bContinuousPenalty = bPlayers.reduce((sum, code) => {
                const lastSlot = playerLastSlot[code];
                return sum + (lastSlot === slot - 1 ? 1000 : 0);
              }, 0);
              
              // 连续两场比赛判断 - 第二优先级
              if (aContinuousPenalty !== bContinuousPenalty) {
                return aContinuousPenalty - bContinuousPenalty;
              }
              
              // 休息时间惩罚 - 最低优先级
              const aRestingPenalty = aPlayers.reduce((sum, code) => {
                const restingSlots = getRestingSlots(code, slot);
                // 休息超过2个时间段开始累加惩罚值
                return sum + (restingSlots > 2 ? (restingSlots - 2) * 10 : 0);
              }, 0);
              
              const bRestingPenalty = bPlayers.reduce((sum, code) => {
                const restingSlots = getRestingSlots(code, slot);
                return sum + (restingSlots > 2 ? (restingSlots - 2) * 10 : 0);
              }, 0);
              
              return bRestingPenalty - aRestingPenalty; // 休息过长的优先安排
            });
            
            const match = available[0];
            
            // 分配
            slotMatches.push({
              timeSlot: slot,
              court: c,
              teamA: match.teamA,
              teamB: match.teamB,
              formation: match.formation,
              teamAPlayers: match.teamAPlayers,
              teamBPlayers: match.teamBPlayers
            });
            
            // 标记队员本时间段已用
            [...match.teamAPlayers, ...match.teamBPlayers].forEach(code => usedPlayers.add(code));
            
            // 更新队员出场记录
            [...match.teamAPlayers, ...match.teamBPlayers].forEach(code => {
              playerLastSlot[code] = slot;
              if (Array.isArray(playerSlotHistory[code])) {
                playerSlotHistory[code].push(slot);
              } else {
                playerSlotHistory[code] = [slot];
              }
            });
            
            // 从任务池移除
            remainTasks = remainTasks.filter(t => 
              !(t.teamA === match.teamA && 
                t.teamB === match.teamB && 
                t.formation === match.formation)
            );
            
            canAllocateMore = true; // 成功分配，继续尝试
          }
        }
        
        // 记录本时间段所有比赛
        scheduleResult.push(...slotMatches);
        slot++;
      }

      setSchedule(scheduleResult);
      localStorage.setItem('tournamentSchedule', JSON.stringify(scheduleResult));
      
      // 同时也保存为比赛记录格式，以便比赛管理页面可以显示
      const matchesData = scheduleResult.map((item, index) => ({
        id: `local_${index}`,
        round: Math.ceil(item.timeSlot / 2),
        timeSlot: item.timeSlot - 1,
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
      localStorage.setItem('tournamentMatches', JSON.stringify(matchesData));
      
      // 同时将数据保存到 badminton_matches 和 badminton_timeSlots，以便数据管理界面访问
      localStorage.setItem('badminton_matches', JSON.stringify(matchesData));
      
      // 提取所有时间段，并且格式化为字符串数组
      const allTimeSlots = Array.from(
        new Set(scheduleResult.map(item => `第${item.timeSlot}时段`))
      ).sort();
      localStorage.setItem('badminton_timeSlots', JSON.stringify(allTimeSlots));
      
      // 更新全局状态
      setMatches(matchesData);
      setTimeSlots(allTimeSlots);
      
      message.success('赛程生成成功！');
    } catch (error) {
      message.error('赛程生成失败');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // 清除赛程
  const clearSchedule = () => {
    setSchedule([]);
    localStorage.removeItem('tournamentSchedule');
    localStorage.removeItem('tournamentMatches');
    
    // 同时清除用于数据管理界面的存储
    localStorage.removeItem('badminton_matches');
    localStorage.removeItem('badminton_timeSlots');
    
    // 清空全局状态
    setMatches([]);
    setTimeSlots([]);
    
    message.success('赛程已清除');
  };

  // 加载已保存的赛程
  useEffect(() => {
    const savedSchedule = localStorage.getItem('tournamentSchedule');
    if (savedSchedule) {
      try {
        const parsed = JSON.parse(savedSchedule);
        // 确保所有必需字段都存在
        const validSchedule = parsed.map((item: any) => ({
          timeSlot: typeof item.timeSlot === 'number' ? item.timeSlot : 1,
          court: typeof item.court === 'number' ? item.court : 1,
          teamA: typeof item.teamA === 'string' ? item.teamA : '',
          teamB: typeof item.teamB === 'string' ? item.teamB : '',
          formation: typeof item.formation === 'string' ? item.formation : '',
          teamAPlayers: Array.isArray(item.teamAPlayers) ? item.teamAPlayers : [],
          teamBPlayers: Array.isArray(item.teamBPlayers) ? item.teamBPlayers : [],
        }));
        setSchedule(validSchedule);
      } catch (error) {
        console.error('Failed to parse saved schedule', error);
      }
    }
  }, []);

  // 生成队员code到姓名的映射
  const playerNameMap: Record<string, string> = {};
  try {
    const players: PlayerInfo[] = JSON.parse(localStorage.getItem('tournamentPlayers') || '[]');
    players.forEach(p => {
      playerNameMap[p.code] = p.name ? p.name : p.code;
    });
  } catch (error) {
    console.error('Failed to generate player name map', error);
  }

  if (!readyStatus.configReady) {
    return (
      <Card>
        <Result
          status="warning"
          title="请先完成比赛统筹配置"
          extra={
            <Button type="primary" onClick={() => navigate('/tournament-setup')}>
              前往配置
            </Button>
          }
        />
      </Card>
    );
  }

  const columns = [
    {
      title: '时间段',
      dataIndex: 'timeSlot',
      key: 'timeSlot',
      render: (slot: number) => `T${slot}`
    },
    {
      title: '场地',
      dataIndex: 'court',
      key: 'court',
      render: (court: number) => <Tag color="green">场地{court}</Tag>
    },
    {
      title: '对阵',
      key: 'match',
      render: (_: any, record: MatchSchedule) => (
        <Space>
          <Tag color="orange">{record.teamA}</Tag>
          <span>VS</span>
          <Tag color="orange">{record.teamB}</Tag>
        </Space>
      )
    },
    {
      title: '比赛场次',
      key: 'matchType',
      render: (_: any, record: MatchSchedule) => `第${record.formation}场`
    },
    {
      title: '阵容',
      dataIndex: 'formation',
      key: 'formation',
      render: (formation: string) => <Tag>{formation}</Tag>
    },
    {
      title: '队员',
      key: 'players',
      render: (_: any, record: MatchSchedule) => (
        <div>
          <div><b>{record.teamA}：</b>{record.teamAPlayers.map((code: string) => playerNameMap[code] || code).join('、')}</div>
          <div><b>{record.teamB}：</b>{record.teamBPlayers.map((code: string) => playerNameMap[code] || code).join('、')}</div>
        </div>
      )
    }
  ];

  // 计算统计信息
  const totalMatches = schedule.length;
  const totalTimeSlots = schedule.length > 0 ? Math.max(...schedule.map(s => s.timeSlot)) : 0;
  const totalRounds = Math.ceil(totalTimeSlots / 2); // 简单估算轮次
  const estimatedTime = tournamentConfig ? 
    (totalTimeSlots * tournamentConfig.matchDuration) : 0;
  const estimatedHours = Math.floor(estimatedTime / 60);
  const estimatedMinutes = Math.round(estimatedTime % 60);

  return (
    <div>
      <Title level={2}>
        <ScheduleOutlined /> 赛程生成
      </Title>

      {/* 准备状态检查 */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={12}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                {readyStatus.configReady ? (
                  <Space>
                    <CheckCircleOutlined style={{ color: '#52c41a' }} />
                    <Text>比赛统筹已配置</Text>
                  </Space>
                ) : (
                  <Space>
                    <CloseCircleOutlined style={{ color: '#f5222d' }} />
                    <Text>比赛统筹未配置</Text>
                  </Space>
                )}
              </div>
              <div>
                {readyStatus.formationsReady ? (
                  <Space>
                    <CheckCircleOutlined style={{ color: '#52c41a' }} />
                    <Text>所有队伍阵容已配置</Text>
                  </Space>
                ) : (
                  <Space>
                    <CloseCircleOutlined style={{ color: '#f5222d' }} />
                    <Text>队伍阵容未完成</Text>
                  </Space>
                )}
              </div>
            </Space>
          </Col>
          <Col span={12}>
            {tournamentConfig && (
              <Space direction="vertical">
                <Text>队伍数量：{tournamentConfig.teamCount}</Text>
                <Text>场地数量：{tournamentConfig.courtCount}</Text>
                <Text>比赛项目：{tournamentConfig.formations.length}项</Text>
              </Space>
            )}
          </Col>
        </Row>
      </Card>

      {/* 缺失配置提示 */}
      {!readyStatus.formationsReady && readyStatus.missingTeams.length > 0 && (
        <Alert
          message="以下队伍尚未配置阵容"
          description={
            <Space>
              {readyStatus.missingTeams.map(team => (
                <Tag key={team} color="error">队伍 {team}</Tag>
              ))}
            </Space>
          }
          type="warning"
          showIcon
          action={
            <Button size="small" onClick={() => navigate('/formations')}>
              前往配置
            </Button>
          }
          style={{ marginBottom: 16 }}
        />
      )}

      {/* 操作按钮 */}
      <Card style={{ marginBottom: 16 }}>
        <Space>
          <Button
            type="primary"
            icon={<PlayCircleOutlined />}
            size="large"
            onClick={generateSchedule}
            loading={loading}
            disabled={!readyStatus.formationsReady}
          >
            生成赛程
          </Button>
          {schedule.length > 0 && (
            <Button onClick={clearSchedule}>
              清除赛程
            </Button>
          )}
        </Space>
      </Card>

      {/* 赛程结果 */}
      {schedule.length > 0 && (
        <>
          <Card title="赛程统计" style={{ marginBottom: 16 }}>
            <Row gutter={16}>
              <Col span={6}>
                <div style={{ textAlign: 'center' }}>
                  <Text type="secondary">总比赛场次</Text>
                  <div style={{ fontSize: 24, fontWeight: 'bold', color: '#1890ff' }}>
                    {totalMatches}
                  </div>
                </div>
              </Col>
              <Col span={6}>
                <div style={{ textAlign: 'center' }}>
                  <Text type="secondary">时间段数</Text>
                  <div style={{ fontSize: 24, fontWeight: 'bold', color: '#52c41a' }}>
                    {totalTimeSlots}
                  </div>
                </div>
              </Col>
              <Col span={6}>
                <div style={{ textAlign: 'center' }}>
                  <Text type="secondary">轮次数</Text>
                  <div style={{ fontSize: 24, fontWeight: 'bold', color: '#fa8c16' }}>
                    {totalRounds}
                  </div>
                </div>
              </Col>
              <Col span={6}>
                <div style={{ textAlign: 'center' }}>
                  <Text type="secondary">预计用时</Text>
                  <div style={{ fontSize: 24, fontWeight: 'bold', color: '#722ed1' }}>
                    {estimatedHours}h {estimatedMinutes}m
                  </div>
                </div>
              </Col>
            </Row>
          </Card>

          <Card title="详细赛程">
            <Table
              columns={columns}
              dataSource={schedule}
              pagination={{ pageSize: 20 }}
              rowKey={(record) => `${record.timeSlot}-${record.court}-${record.teamA}-${record.teamB}`}
            />
          </Card>
        </>
      )}
    </div>
  );
};

export default ScheduleGeneration; 