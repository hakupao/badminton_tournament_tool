import React, { useState, useEffect } from 'react';
import { Table, Tag, Button, Modal, Space, message, Empty, Select, Alert, Card, Input, Radio, Segmented } from 'antd';
import type { Key } from 'antd/es/table/interface';
import { EditOutlined, TrophyOutlined, UserSwitchOutlined, TableOutlined, AppstoreOutlined, DownloadOutlined } from '@ant-design/icons';
import { Match } from '../types';
import { useNavigate } from 'react-router-dom';
import { useAppState } from '../store';
import * as XLSX from 'xlsx';

const { Option } = Select;

// 定义PlayerInfo接口，与TeamManagement中的保持一致
interface PlayerInfo {
  code: string; // 如 A1, B2
  name: string;
  teamCode: string; // 如 A, B
  playerNumber: number; // 如 1, 2
}

// 自定义类型定义
interface MatrixRowData {
  timeSlot: number;
  [key: string]: any;
}

// 使用React.memo优化比分选择组件
const ScoreInput = React.memo(({ value, onChange }: { value: number, onChange: (value: number | null) => void }) => {
  // 生成0-21的分数选项
  const scoreOptions = Array.from({ length: 22 }, (_, i) => i);

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(11, 1fr)',
      gap: '8px',
      width: '100%'
    }}>
      {scoreOptions.map(score => (
        <Button
          key={score}
          size="large"
          type={value === score ? 'primary' : 'default'}
          style={{
            width: '100%',
            height: '50px',
            padding: 0,
            fontSize: score > 9 ? '18px' : '20px',
            fontWeight: value === score ? 'bold' : 'normal',
            borderColor: value === score ? '#1890ff' : '#d9d9d9',
            boxShadow: value === score ? '0 2px 0 rgba(24, 144, 255, 0.2)' : 'none'
          }}
          onClick={() => onChange(score)}
        >
          {score}
        </Button>
      ))}
    </div>
  );
});

const MatchList: React.FC = () => {
  const { matches: globalMatches, setMatches: setGlobalMatches } = useAppState();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(false);
  const [scoreModalVisible, setScoreModalVisible] = useState(false);
  const [playersModalVisible, setPlayersModalVisible] = useState(false);
  const [exportModalVisible, setExportModalVisible] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [scores, setScores] = useState<{ teamAScore: number; teamBScore: number }>({
    teamAScore: 0,
    teamBScore: 0,
  });
  const [allPlayers, setAllPlayers] = useState<PlayerInfo[]>([]);
  const [selectedTeamAPlayers, setSelectedTeamAPlayers] = useState<string[]>([]);
  const [selectedTeamBPlayers, setSelectedTeamBPlayers] = useState<string[]>([]);
  const [tournamentConfig, setTournamentConfig] = useState<{
    teamCount: number;
    teamCapacity: number;
    formations: string[];
    courtCount: number;
    matchDuration: number;
  } | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'matrix'>('matrix'); // 默认使用矩阵视图
  const [exportFileName, setExportFileName] = useState('羽毛球比赛列表');
  const navigate = useNavigate();

  // 使用useCallback优化设置比分函数，避免不必要的重新创建
  const handleTeamAScoreChange = React.useCallback((value: number | null) => {
    setScores(prev => ({ ...prev, teamAScore: value || 0 }));
  }, []);

  const handleTeamBScoreChange = React.useCallback((value: number | null) => {
    setScores(prev => ({ ...prev, teamBScore: value || 0 }));
  }, []);

  // 使用useCallback优化模态框取消函数
  const handleScoreModalCancel = React.useCallback(() => {
    setScoreModalVisible(false);
  }, []);

  // 使用useCallback优化模态框确认函数
  const handlePlayersModalCancel = React.useCallback(() => {
    setPlayersModalVisible(false);
  }, []);

  useEffect(() => {
    // 如果全局状态中有数据，直接使用全局状态
    if (globalMatches && globalMatches.length > 0) {
      setMatches(globalMatches);
    } else {
      // 否则从localStorage加载
      loadMatches();
    }

    // 加载所有队员信息
    loadPlayers();

    // 加载比赛统筹配置
    loadTournamentConfig();
  }, [globalMatches]);

  // 调试用：监控数据变化
  useEffect(() => {
    if (matches.length > 0) {
      console.log('当前比赛数据:', matches);
      console.log('第一场比赛队伍ID格式:', {
        teamA_Id: matches[0].teamA_Id,
        teamB_Id: matches[0].teamB_Id
      });
    }
  }, [matches]);

  useEffect(() => {
    if (allPlayers.length > 0) {
      console.log('当前队员数据:', allPlayers);
      console.log('队员样例:', allPlayers[0]);
    }
  }, [allPlayers]);

  const loadPlayers = () => {
    try {
      // 从localStorage加载队员数据
      const savedPlayers = localStorage.getItem('tournamentPlayers');
      if (savedPlayers) {
        const parsedPlayers = JSON.parse(savedPlayers);
        console.log('加载到的队员数据:', parsedPlayers);
        setAllPlayers(parsedPlayers);
      } else {
        console.log('未找到队员数据');
        // 尝试加载已保存的队伍配置
        const savedConfig = localStorage.getItem('tournamentConfig');
        if (savedConfig) {
          const config = JSON.parse(savedConfig);
          const { teamCount, teamCapacity } = config;

          // 初始化空队员数据
          const emptyPlayers: PlayerInfo[] = [];
          for (let i = 0; i < teamCount; i++) {
            const teamCode = String.fromCharCode(65 + i);
            for (let j = 1; j <= teamCapacity; j++) {
              emptyPlayers.push({
                code: `${teamCode}${j}`,
                name: `队员${teamCode}${j}`,
                teamCode,
                playerNumber: j,
              });
            }
          }
          console.log('初始化的队员数据:', emptyPlayers);
          setAllPlayers(emptyPlayers);
          setTournamentConfig(config);
        }
      }
    } catch (error) {
      console.error('加载队员数据失败:', error);
    }
  };

  // 修改loadMatches函数，确保所有比赛都有正确的序号
  const loadMatches = () => {
    setLoading(true);
    try {
      // 从localStorage加载比赛数据
      const savedMatches = localStorage.getItem('tournamentMatches');
      if (savedMatches) {
        let parsedMatches = JSON.parse(savedMatches);

        // 确保所有比赛都有matchNumber
        let hasUpdates = false;
        let maxNum = 0;

        // 先找出当前最大序号
        parsedMatches.forEach((match: Match) => {
          if (match.matchNumber) {
            const num = parseInt(match.matchNumber.replace(/\D/g, ''));
            if (!isNaN(num) && num > maxNum) {
              maxNum = num;
            }
          }
        });

        // 为没有序号的比赛分配序号
        parsedMatches = parsedMatches.map((match: Match) => {
          if (!match.matchNumber) {
            hasUpdates = true;
            maxNum++;
            return {
              ...match,
              matchNumber: `00${maxNum}`.slice(-3)
            };
          }
          return match;
        });

        // 只有在有更新时才保存
        if (hasUpdates) {
          localStorage.setItem('tournamentMatches', JSON.stringify(parsedMatches));
        }

        setMatches(parsedMatches);
        setGlobalMatches(parsedMatches);
      } else {
        // 如果没有预先准备的比赛数据，尝试从赛程数据转换
        const savedSchedule = localStorage.getItem('tournamentSchedule');
        if (savedSchedule) {
          const scheduleData = JSON.parse(savedSchedule);

          // 将赛程数据转换为匹配Match接口的格式
          const localMatches: Match[] = scheduleData.map((item: any, index: number) => ({
            id: `local_${index}`,
            matchNumber: `00${index + 1}`.slice(-3), // 添加序号
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

  // 使用localStorage保存比分，同时更新全局状态
  const saveScoreToLocalStorage = React.useCallback((matchId: string, newScores: any, winner_TeamId?: string) => {
    // 使用深拷贝避免对原始数据的直接修改，减少不必要的渲染
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

    // 直接保存到localStorage，简化实现
    try {
      localStorage.setItem('tournamentMatches', JSON.stringify(updatedMatches));

      // 立即更新状态以提高响应速度
      setMatches(updatedMatches);
      setGlobalMatches(updatedMatches);
    } catch (error) {
      console.error('保存数据失败:', error);
      message.error('保存数据失败');
    }
  }, [matches]);

  const handleEditScore = React.useCallback((match: Match) => {
    // 简化实现，移除可能导致问题的代码
    try {
      // 设置选中的比赛
      setSelectedMatch(match);

      // 设置初始比分
      if (match.scores && match.scores.length > 0) {
        setScores({
          teamAScore: match.scores[0]?.teamAScore || 0,
          teamBScore: match.scores[0]?.teamBScore || 0,
        });
      } else {
        setScores({ teamAScore: 0, teamBScore: 0 });
      }

      // 显示对话框
      setScoreModalVisible(true);
    } catch (error) {
      console.error('打开比分对话框失败:', error);
      message.error('打开比分对话框失败');
    }
  }, []);

  const handleEditPlayers = React.useCallback((match: Match) => {
    try {
      // 设置选中的比赛
      setSelectedMatch(match);

      // 提取队伍代码
      const teamACode = match.teamA_Id?.charAt?.(match.teamA_Id.length - 1) || 'A';
      const teamBCode = match.teamB_Id?.charAt?.(match.teamB_Id.length - 1) || 'B';

      // 如果已有队员数据，使用已有的；否则初始化空数组
      let teamAPlayers = match.teamA_Players || [];
      let teamBPlayers = match.teamB_Players || [];

      // 根据比赛类型和比赛统筹配置设置默认队员
      const formations = tournamentConfig?.formations || ['1+2', '3+5'];

      // 找到对应的阵型
      if (teamAPlayers.length === 0 && teamBPlayers.length === 0) {
        // 如果是混双比赛(3+5)，默认选择第三和第五号队员
        if (match.matchType.includes('3+5') || match.matchType === 'XD1') {
          const formation = formations.find(f => f.includes('3') && f.includes('5')) || '3+5';
          const [pos1, pos2] = formation.split('+').map(Number);

          teamAPlayers = [`${teamACode}${pos1}`, `${teamACode}${pos2}`];
          teamBPlayers = [`${teamBCode}${pos1}`, `${teamBCode}${pos2}`];
        }
        // 男双比赛一般用1号和2号队员
        else if (match.matchType.includes('1+2') || match.matchType === 'MD1' || match.matchType === 'MD2') {
          const formation = formations.find(f => f.includes('1') && f.includes('2')) || '1+2';
          const [pos1, pos2] = formation.split('+').map(Number);

          teamAPlayers = [`${teamACode}${pos1}`, `${teamACode}${pos2}`];
          teamBPlayers = [`${teamBCode}${pos1}`, `${teamBCode}${pos2}`];
        }
        // 如果还有其他类型，就用配置的第一个阵型
        else if (formations.length > 0) {
          const [pos1, pos2] = formations[0].split('+').map(Number);

          teamAPlayers = [`${teamACode}${pos1}`, `${teamACode}${pos2}`];
          teamBPlayers = [`${teamBCode}${pos1}`, `${teamBCode}${pos2}`];
        }
      }

      setSelectedTeamAPlayers(teamAPlayers);
      setSelectedTeamBPlayers(teamBPlayers);

      // 显示对话框
      setPlayersModalVisible(true);
    } catch (error) {
      console.error('打开队员选择对话框失败:', error);
      message.error('打开队员选择对话框失败');
    }
  }, [tournamentConfig]);

  // 使用useCallback优化保存比分函数
  const handleSaveScore = React.useCallback(() => {
    if (!selectedMatch) return;

    try {
      const matchScores = [
        { set: 1, teamAScore: scores.teamAScore, teamBScore: scores.teamBScore },
      ];

      // 根据比分确定获胜者
      const winner_TeamId = scores.teamAScore > scores.teamBScore ?
        selectedMatch.teamA_Id :
        scores.teamBScore > scores.teamAScore ?
          selectedMatch.teamB_Id :
          undefined;

      // 先关闭对话框
      setScoreModalVisible(false);

      // 更新本地存储和状态
      saveScoreToLocalStorage(selectedMatch.id, matchScores, winner_TeamId);

      // 显示成功消息
      message.success('比分更新成功');
    } catch (error) {
      message.error('更新比分失败');
      console.error('更新比分错误:', error);
    }
  }, [selectedMatch, scores, saveScoreToLocalStorage]);

  const getMatchTypeName = (type: string) => {
    switch (type) {
      case 'MD1': return '第一男双';
      case 'MD2': return '第二男双';
      case 'XD1': return '混双';
      default: return type;
    }
  };

  const getStatusTag = (status: string, winner_TeamId?: string) => {
    switch (status) {
      case 'pending':
        return <Tag color="default">未开始</Tag>;
      case 'ongoing':
        return <Tag color="processing">进行中</Tag>;
      case 'finished':
        if (winner_TeamId) {
          const teamCode = winner_TeamId.charAt(winner_TeamId.length - 1);
          return <Tag color="success">{`${teamCode}队获胜`}</Tag>;
        }
        return <Tag color="success">已结束</Tag>;
      default:
        return <Tag>{status}</Tag>;
    }
  };

  // 使用useCallback优化保存队员函数
  const handleSavePlayers = React.useCallback(() => {
    if (!selectedMatch) return;

    try {
      // 获取选手的姓名
      const teamA_PlayerNames = selectedTeamAPlayers.map((playerId: string) => {
        const player = allPlayers.find(p => p.code === playerId);
        return player ? player.name || playerId : playerId;
      });

      const teamB_PlayerNames = selectedTeamBPlayers.map((playerId: string) => {
        const player = allPlayers.find(p => p.code === playerId);
        return player ? player.name || playerId : playerId;
      });

      // 更新比赛选手
      const updatedMatches = matches.map(match => {
        if (match.id === selectedMatch.id) {
          return {
            ...match,
            teamA_Players: selectedTeamAPlayers,
            teamB_Players: selectedTeamBPlayers,
            teamA_PlayerNames,
            teamB_PlayerNames
          };
        }
        return match;
      });

      // 先关闭对话框
      setPlayersModalVisible(false);

      // 保存数据到localStorage
      try {
        localStorage.setItem('tournamentMatches', JSON.stringify(updatedMatches));

        // 更新状态
        setMatches(updatedMatches);
        setGlobalMatches(updatedMatches);

        // 显示成功消息
        message.success('参赛选手已更新');
      } catch (storageError) {
        console.error('保存队员数据失败:', storageError);
        message.error('保存队员数据失败');
      }
    } catch (error) {
      message.error('更新参赛选手失败');
      console.error('更新参赛选手错误:', error);
    }
  }, [selectedMatch, selectedTeamAPlayers, selectedTeamBPlayers, allPlayers, matches]);

  // 获取队员显示名称 - 使用React.useMemo优化
  const getPlayerDisplayName = React.useCallback((playerId: string) => {
    const player = allPlayers.find(p => p.code === playerId);
    if (player && player.name) {
      return `${playerId} - ${player.name}`;
    }
    return playerId;
  }, [allPlayers]);

  // 生成对阵双方队员名单的显示 - 优化使用React.memo
  const renderPlayerNames = React.useCallback((match: Match) => {
    return (
      <div style={{ textAlign: 'center' }}>
        <div style={{ marginBottom: 8 }}>
          {match.teamA_Players.map((playerId, index) => (
            <Tag color="blue" key={`a-${index}`} style={{ margin: '2px' }}>
              {getPlayerDisplayName(playerId)}
            </Tag>
          ))}
        </div>
        <div>
          {match.teamB_Players.map((playerId, index) => (
            <Tag color="red" key={`b-${index}`} style={{ margin: '2px' }}>
              {getPlayerDisplayName(playerId)}
            </Tag>
          ))}
        </div>
      </div>
    );
  }, [getPlayerDisplayName]);

  const columns = [
    {
      title: '序号',
      dataIndex: 'matchNumber',
      key: 'matchNumber',
      width: 80,
      sorter: (a: Match, b: Match) => parseInt(a.matchNumber || '0') - parseInt(b.matchNumber || '0'),
      render: (_: any, record: Match, index: number) => record.matchNumber || `00${index + 1}`.slice(-3),
    },
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
      filters: matches.reduce((acc: { text: string; value: string }[], match) => {
        const teamA = match.teamA_Name || '';
        const teamB = match.teamB_Name || '';
        if (!acc.find(item => item.value === teamA) && teamA) {
          acc.push({ text: teamA, value: teamA });
        }
        if (!acc.find(item => item.value === teamB) && teamB) {
          acc.push({ text: teamB, value: teamB });
        }
        return acc;
      }, []),
      onFilter: (value: boolean | Key, record: Match) => {
        const teamValue = String(value);
        return record.teamA_Name === teamValue || record.teamB_Name === teamValue;
      },
      render: (record: Match) => (
        <Space>
          <Tag color="blue">{record.teamA_Name}</Tag>
          <span>VS</span>
          <Tag color="red">{record.teamB_Name}</Tag>
        </Space>
      ),
    },
    {
      title: '参赛队员',
      key: 'players',
      filters: matches.reduce((acc: { text: string; value: string }[], match) => {
        const allPlayers = [...(match.teamA_Players || []), ...(match.teamB_Players || [])];
        allPlayers.forEach(playerId => {
          const displayName = getPlayerDisplayName(playerId);
          if (!acc.find(item => item.value === playerId)) {
            acc.push({ text: displayName, value: playerId });
          }
        });
        return acc;
      }, []),
      onFilter: (value: boolean | Key, record: Match) => {
        const playerValue = String(value);
        return (record.teamA_Players || []).includes(playerValue) ||
          (record.teamB_Players || []).includes(playerValue);
      },
      render: (record: Match) => renderPlayerNames(record),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string, record: Match) => getStatusTag(status, record.winner_TeamId),
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
          <Button
            type="default"
            icon={<UserSwitchOutlined />}
            onClick={() => handleEditPlayers(record)}
          >
            更换队员
          </Button>
        </Space>
      ),
    },
  ];

  // 加载比赛统筹配置
  const loadTournamentConfig = () => {
    try {
      const savedConfig = localStorage.getItem('tournamentConfig');
      if (savedConfig) {
        const config = JSON.parse(savedConfig);
        console.log('加载到的比赛统筹配置:', config);
        setTournamentConfig(config);
      } else {
        console.log('未找到比赛统筹配置，使用默认值');
        setTournamentConfig({
          teamCount: 8,
          teamCapacity: 6,
          formations: ['1+2', '3+5'],
          courtCount: 4,
          matchDuration: 30
        });
      }
    } catch (error) {
      console.error('加载比赛统筹配置失败:', error);
      setTournamentConfig({
        teamCount: 8,
        teamCapacity: 6,
        formations: ['1+2', '3+5'],
        courtCount: 4,
        matchDuration: 30
      });
    }
  };

  // 生成矩阵视图数据
  const generateMatrixData = (matches: Match[]): MatrixRowData[] => {
    if (!matches.length) return [];

    // 获取所有时间段
    const timeSlots = [...new Set(matches.map(match => match.timeSlot))].sort((a, b) => a - b);

    // 获取所有场地
    const courts = [...new Set(matches.map(match => match.court))].sort((a, b) => a - b);

    // 按时间段和场地组织比赛数据
    const matrixData = timeSlots.map(timeSlot => {
      const row: MatrixRowData = { timeSlot };

      courts.forEach(court => {
        const courtMatch = matches.find(match => match.timeSlot === timeSlot && match.court === court);
        row[`court${court}`] = courtMatch || null;
      });

      return row;
    });

    return matrixData;
  };

  // 矩阵视图组件
  const MatrixView: React.FC<{ matches: Match[] }> = ({ matches }) => {
    // 计算矩阵数据和场地
    const matrixData = generateMatrixData(matches);
    const courts = [...new Set(matches.map(match => match.court))].sort((a, b) => a - b);

    // 获取所有时间段，用于生成选项卡
    const allTimeSlots = matrixData.map(row => row.timeSlot);

    // 当前选中的时间段，默认选中第一个
    const [activeTimeSlot, setActiveTimeSlot] = useState<number>(
      allTimeSlots.length > 0 ? allTimeSlots[0] : 0
    );

    // 监听数据变化，如果当前选中的时间段不存在了，重置为第一个
    useEffect(() => {
      if (allTimeSlots.length > 0 && !allTimeSlots.includes(activeTimeSlot)) {
        setActiveTimeSlot(allTimeSlots[0]);
      } else if (allTimeSlots.length > 0 && activeTimeSlot === undefined) {
        setActiveTimeSlot(allTimeSlots[0]);
      }
    }, [allTimeSlots, activeTimeSlot]);

    // 过滤出当前选中时间段的数据
    const currentSlotData = matrixData.filter(row => row.timeSlot === activeTimeSlot);

    const styles = {
      matrixView: {
        backgroundColor: '#f0f2f5',
        padding: '20px',
        borderRadius: '8px',
        boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
        height: '100%', // 确保填满容器
        display: 'flex',
        flexDirection: 'column' as const
      },
      timeSlotSelector: {
        marginBottom: '24px',
        backgroundColor: 'transparent',
        padding: '0',
      },
      // 新增：Chips 容器样式
      chipsContainer: {
        display: 'flex',
        flexWrap: 'wrap' as const,
        justifyContent: 'flex-start',
        gap: '12px',
        padding: '4px'
      },
      contentContainer: {
        flex: 1,
        overflow: 'hidden' // 隐藏垂直滚动条
      },
      timeSlotContainer: {
        marginBottom: '0', // 移除底部边距，因为只显示一个
        height: '100%'
      },
      // 移除单独的时间段标题，因为上面已经有选择器了
      matchesRow: {
        display: 'flex',
        flexWrap: 'nowrap' as const,
        gap: '16px',
        overflowX: 'auto' as const,
        padding: '4px 4px 12px 4px', // 增加底部内边距给滚动条留空间
        height: '100%', // 充满高度
        alignItems: 'flex-start'
      },
      matchContainer: {
        flex: '1 0 0',
        minWidth: '240px', // 稍微增加宽度
        padding: '0',
        height: '100%',
        transition: 'all 0.3s ease'
      },
      courtTitle: {
        fontWeight: 'bold' as const,
        textAlign: 'center' as const,
        marginBottom: '16px',
        color: '#1890ff',
        fontSize: '16px',
        letterSpacing: '1px'
      },
      emptyMatch: {
        height: '240px',
        display: 'flex',
        flexDirection: 'column' as const,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fff',
        border: '1px dashed #e8e8e8',
        borderRadius: '8px',
        color: '#ccc',
        fontSize: '14px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
      }
    };

    return (
      <div style={styles.matrixView}>
        {/* 时间段选择器 - 使用自定义 Chip 样式 */}
        {allTimeSlots.length > 0 && (
          <div style={styles.timeSlotSelector}>
            <div style={styles.chipsContainer}>
              {allTimeSlots.map(slot => {
                const isActive = activeTimeSlot === slot;
                return (
                  <Button
                    key={slot}
                    type={isActive ? 'primary' : 'default'}
                    onClick={() => setActiveTimeSlot(slot)}
                    shape="round"
                    size="middle"
                    style={{
                      minWidth: '100px',
                      fontWeight: isActive ? 'bold' : 'normal',
                      boxShadow: isActive ? '0 2px 8px rgba(24, 144, 255, 0.35)' : '0 1px 2px rgba(0,0,0,0.05)',
                      border: isActive ? 'none' : '1px solid #d9d9d9',
                      transition: 'all 0.3s cubic-bezier(0.645, 0.045, 0.355, 1)',
                      transform: isActive ? 'scale(1.05)' : 'scale(1)'
                    }}
                  >
                    第{slot + 1}时段
                  </Button>
                );
              })}
            </div>
          </div>
        )}

        <div style={styles.contentContainer}>
          {/* 只显示当前选中的时间段 */}
          {currentSlotData.map((row: MatrixRowData) => (
            <div key={row.timeSlot} style={styles.timeSlotContainer}>
              {/* 该时间段的所有比赛 */}
              <div style={styles.matchesRow}>
                {courts.map(court => (
                  <div key={court} style={styles.matchContainer}>
                    <div style={styles.courtTitle}>{court}号场地</div>
                    {row[`court${court}`] ?
                      <MatchCard match={row[`court${court}`]} />
                      : (
                        <div style={styles.emptyMatch}>
                          <AppstoreOutlined style={{ fontSize: '24px', marginBottom: '8px', color: '#e8e8e8' }} />
                          <span>未安排比赛</span>
                        </div>
                      )
                    }
                  </div>
                ))}
              </div>
            </div>
          ))}

          {allTimeSlots.length === 0 && (
            <Empty description="暂无比赛数据" />
          )}
        </div>
      </div>
    );
  };

  // 使用React.memo优化比赛卡片组件
  const MatchCard = React.memo(({ match }: { match: Match }) => {
    const styles = {
      matchCard: {
        width: '100%',
        height: '100%',
        minHeight: '200px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      },
      matchCardTitle: {
        textAlign: 'center' as const,
        fontWeight: 'bold' as const,
        fontSize: '14px',
        backgroundColor: '#fafafa'
      },
      matchContent: {
        display: 'flex',
        flexDirection: 'column' as const,
        justifyContent: 'space-between' as const,
        height: '100%',
        padding: '4px 0'
      },
      teams: {
        display: 'flex',
        justifyContent: 'center' as const,
        alignItems: 'center' as const,
        gap: '8px',
        marginBottom: '8px'
      },
      buttonGroup: {
        display: 'flex',
        justifyContent: 'center' as const,
        marginTop: '10px',
        gap: '5px'
      },
      actionButton: {
        padding: '0 8px',
        height: '28px',
        fontSize: '12px'
      }
    };

    return (
      <Card
        size="small"
        style={styles.matchCard}
        title={getMatchTypeName(match.matchType)}
        headStyle={styles.matchCardTitle}
      >
        <div style={styles.matchContent}>
          <div>
            <div style={styles.teams}>
              <Tag color="blue">{match.teamA_Name}</Tag>
              <span>VS</span>
              <Tag color="red">{match.teamB_Name}</Tag>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ marginBottom: 8 }}>
                {match.teamA_Players.map((playerId, index) => (
                  <Tag color="blue" key={`a-${index}`} style={{ margin: '2px' }}>
                    {getPlayerDisplayName(playerId)}
                  </Tag>
                ))}
              </div>
              <div>
                {match.teamB_Players.map((playerId, index) => (
                  <Tag color="red" key={`b-${index}`} style={{ margin: '2px' }}>
                    {getPlayerDisplayName(playerId)}
                  </Tag>
                ))}
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>{getStatusTag(match.status, match.winner_TeamId)}</div>
          </div>
          <div style={styles.buttonGroup}>
            <Button
              size="small"
              type="primary"
              icon={<EditOutlined />}
              onClick={() => handleEditScore(match)}
              style={styles.actionButton}
            >
              记录比分
            </Button>
            <Button
              size="small"
              type="default"
              icon={<UserSwitchOutlined />}
              onClick={() => handleEditPlayers(match)}
              style={styles.actionButton}
            >
              更换队员
            </Button>
          </div>
        </div>
      </Card>
    );
  });

  // 修改导出Excel函数，确保使用最新数据
  const exportToExcel = () => {
    try {
      // 确保所有比赛都有序号
      const matchesWithNumbers = matches.map((match, index) => {
        if (!match.matchNumber) {
          return {
            ...match,
            matchNumber: `00${index + 1}`.slice(-3)
          };
        }
        return match;
      });

      // 如果有更新，同步到状态
      if (JSON.stringify(matchesWithNumbers) !== JSON.stringify(matches)) {
        setMatches(matchesWithNumbers);
        setGlobalMatches(matchesWithNumbers);
        localStorage.setItem('tournamentMatches', JSON.stringify(matchesWithNumbers));
      }

      // 获取矩阵数据
      const matrixData = generateMatrixData(matchesWithNumbers);

      // 获取所有场地
      const courts = [...new Set(matchesWithNumbers.map(match => match.court))].sort((a, b) => a - b);

      // 创建工作簿
      const workbook = XLSX.utils.book_new();

      // 1. 创建简单矩阵视图工作表
      const simpleWorksheet = XLSX.utils.aoa_to_sheet([]);

      // 添加表头行
      const headerRow = ['时间段', ...courts.map(court => `${court}号场地`)];
      XLSX.utils.sheet_add_aoa(simpleWorksheet, [headerRow], { origin: 'A1' });

      // 添加数据行
      matrixData.forEach((row, rowIndex) => {
        const dataRow = [`第${row.timeSlot + 1}时段`];

        courts.forEach(court => {
          const match = row[`court${court}`];
          if (match) {
            // 获取队员编码
            const teamACode = match.teamA_Id?.charAt?.(match.teamA_Id.length - 1) || 'A';
            const teamBCode = match.teamB_Id?.charAt?.(match.teamB_Id.length - 1) || 'B';

            // 处理队员信息
            let teamAPlayersStr = '';
            let teamAPlayersNames = '';
            let teamBPlayersStr = '';
            let teamBPlayersNames = '';

            if (match.teamA_Players && match.teamA_Players.length > 0) {
              teamAPlayersStr = match.teamA_Players.join('+');

              // 获取A队队员姓名
              teamAPlayersNames = match.teamA_Players.map((playerId: string) => {
                const player = allPlayers.find(p => p.code === playerId);
                return player && player.name ? player.name : `队员${playerId}`;
              }).join('+');
            } else {
              // 如果没有指定队员，则根据比赛类型推断
              if (match.matchType.includes('1+2') || match.matchType === 'MD1' || match.matchType === 'MD2') {
                teamAPlayersStr = `${teamACode}1+${teamACode}2`;
                teamAPlayersNames = `队员${teamACode}1+队员${teamACode}2`;
              } else if (match.matchType.includes('3+5') || match.matchType === 'XD1') {
                teamAPlayersStr = `${teamACode}3+${teamACode}5`;
                teamAPlayersNames = `队员${teamACode}3+队员${teamACode}5`;
              } else {
                teamAPlayersStr = `${teamACode}?+${teamACode}?`;
                teamAPlayersNames = `队员${teamACode}?+队员${teamACode}?`;
              }
            }

            if (match.teamB_Players && match.teamB_Players.length > 0) {
              teamBPlayersStr = match.teamB_Players.join('+');

              // 获取B队队员姓名
              teamBPlayersNames = match.teamB_Players.map((playerId: string) => {
                const player = allPlayers.find(p => p.code === playerId);
                return player && player.name ? player.name : `队员${playerId}`;
              }).join('+');
            } else {
              // 如果没有指定队员，则根据比赛类型推断
              if (match.matchType.includes('1+2') || match.matchType === 'MD1' || match.matchType === 'MD2') {
                teamBPlayersStr = `${teamBCode}1+${teamBCode}2`;
                teamBPlayersNames = `队员${teamBCode}1+队员${teamBCode}2`;
              } else if (match.matchType.includes('3+5') || match.matchType === 'XD1') {
                teamBPlayersStr = `${teamBCode}3+${teamBCode}5`;
                teamBPlayersNames = `队员${teamBCode}3+队员${teamBCode}5`;
              } else {
                teamBPlayersStr = `${teamBCode}?+${teamBCode}?`;
                teamBPlayersNames = `队员${teamBCode}?+队员${teamBCode}?`;
              }
            }

            // 新的比赛信息格式（第一行显示编码，第二行显示姓名）
            const matchInfo = `${teamAPlayersStr}:${teamBPlayersStr}\n${teamAPlayersNames}:${teamBPlayersNames}`;
            dataRow.push(matchInfo);
          } else {
            dataRow.push('未安排比赛');
          }
        });

        XLSX.utils.sheet_add_aoa(simpleWorksheet, [dataRow], { origin: { r: rowIndex + 2, c: 0 } });
      });

      // 设置列宽和行高
      const wscols = [
        { wch: 10 }, // 时间段列宽
        ...Array(courts.length).fill({ wch: 40 }) // 场地列宽增加到40以容纳更多文本
      ];
      simpleWorksheet['!cols'] = wscols;

      // 设置单元格文本自动换行
      for (let r = 2; r < matrixData.length + 2; r++) {
        for (let c = 1; c <= courts.length; c++) {
          const cellRef = XLSX.utils.encode_cell({ r: r, c: c });
          if (!simpleWorksheet[cellRef]) continue;

          // 确保单元格有样式属性
          if (!simpleWorksheet[cellRef].s) simpleWorksheet[cellRef].s = {};

          // 启用自动换行
          simpleWorksheet[cellRef].s.alignment = {
            wrapText: true,
            vertical: 'top'
          };
        }
      }

      // 设置行高
      const wsrows = Array(matrixData.length + 2).fill({ hpt: 40 }); // 增加行高以容纳两行文本
      simpleWorksheet['!rows'] = wsrows;

      // 添加简单矩阵视图工作表
      XLSX.utils.book_append_sheet(workbook, simpleWorksheet, '比赛矩阵');

      // 2. 创建详细比赛信息工作表
      const detailsData = [];

      // 添加表头
      detailsData.push([
        '序号',
        '时间段',
        '场地',
        '对阵队员编码',
        '队员姓名',
        '比赛状态',
        '比分'
      ]);

      // 添加比赛数据 - 按照序号排序
      matchesWithNumbers.sort((a, b) => {
        // 首先按照序号排序
        const numA = parseInt((a.matchNumber || '0').replace(/\D/g, ''));
        const numB = parseInt((b.matchNumber || '0').replace(/\D/g, ''));
        if (numA !== numB) return numA - numB;

        // 序号相同则按时间段
        if (a.timeSlot !== b.timeSlot) return a.timeSlot - b.timeSlot;
        // 再按场地排序
        return a.court - b.court;
      }).forEach(match => {
        // 获取队伍代码
        const teamACode = match.teamA_Id?.charAt?.(match.teamA_Id.length - 1) || 'A';
        const teamBCode = match.teamB_Id?.charAt?.(match.teamB_Id.length - 1) || 'B';

        // 处理A队队员字符串
        let teamAPlayersStr = '';
        let teamAPlayersNames = '';
        if (match.teamA_Players && match.teamA_Players.length > 0) {
          teamAPlayersStr = match.teamA_Players.join('+');

          // 获取A队队员姓名
          teamAPlayersNames = match.teamA_Players.map((playerId: string) => {
            const player = allPlayers.find(p => p.code === playerId);
            return player && player.name ? player.name : `队员${playerId}`;
          }).join('+');
        } else {
          // 如果没有指定队员，则根据比赛类型推断
          if (match.matchType.includes('1+2') || match.matchType === 'MD1' || match.matchType === 'MD2') {
            teamAPlayersStr = `${teamACode}1+${teamACode}2`;
            teamAPlayersNames = `队员${teamACode}1+队员${teamACode}2`;
          } else if (match.matchType.includes('3+5') || match.matchType === 'XD1') {
            teamAPlayersStr = `${teamACode}3+${teamACode}5`;
            teamAPlayersNames = `队员${teamACode}3+队员${teamACode}5`;
          } else {
            teamAPlayersStr = `${teamACode}?+${teamACode}?`;
            teamAPlayersNames = `队员${teamACode}?+队员${teamACode}?`;
          }
        }

        // 处理B队队员字符串
        let teamBPlayersStr = '';
        let teamBPlayersNames = '';
        if (match.teamB_Players && match.teamB_Players.length > 0) {
          teamBPlayersStr = match.teamB_Players.join('+');

          // 获取B队队员姓名
          teamBPlayersNames = match.teamB_Players.map((playerId: string) => {
            const player = allPlayers.find(p => p.code === playerId);
            return player && player.name ? player.name : `队员${playerId}`;
          }).join('+');
        } else {
          // 如果没有指定队员，则根据比赛类型推断
          if (match.matchType.includes('1+2') || match.matchType === 'MD1' || match.matchType === 'MD2') {
            teamBPlayersStr = `${teamBCode}1+${teamBCode}2`;
            teamBPlayersNames = `队员${teamBCode}1+队员${teamBCode}2`;
          } else if (match.matchType.includes('3+5') || match.matchType === 'XD1') {
            teamBPlayersStr = `${teamBCode}3+${teamBCode}5`;
            teamBPlayersNames = `队员${teamBCode}3+队员${teamBCode}5`;
          } else {
            teamBPlayersStr = `${teamBCode}?+${teamBCode}?`;
            teamBPlayersNames = `队员${teamBCode}?+队员${teamBCode}?`;
          }
        }

        // 合并的队员格式，用于显示
        const playersFormatStr = `${teamAPlayersStr}:${teamBPlayersStr}`;
        const playersNamesStr = `${teamAPlayersNames}:${teamBPlayersNames}`;

        // 处理比赛状态
        let statusStr = '';
        switch (match.status) {
          case 'pending': statusStr = '未开始'; break;
          case 'ongoing': statusStr = '进行中'; break;
          case 'finished': statusStr = '已结束'; break;
          default: statusStr = match.status;
        }

        // 处理比分字符串
        let scoreStr = '';
        if (match.scores && match.scores.length > 0) {
          scoreStr = `${match.scores[0].teamAScore} : ${match.scores[0].teamBScore}`;
        }

        detailsData.push([
          match.matchNumber || `---`, // 使用比赛的序号，没有显示为---
          `第${match.timeSlot + 1}时段`,
          `${match.court}号场`,
          playersFormatStr,
          playersNamesStr,
          statusStr,
          scoreStr
        ]);
      });

      // 创建详细信息工作表
      const detailsWorksheet = XLSX.utils.aoa_to_sheet(detailsData);

      // 设置详细信息工作表的列宽
      const detailsCols = [
        { wch: 8 },  // 序号
        { wch: 10 }, // 时间段
        { wch: 8 },  // 场地
        { wch: 20 }, // 对阵队员编码
        { wch: 30 }, // 队员姓名
        { wch: 10 }, // 比赛状态
        { wch: 10 }  // 比分
      ];
      detailsWorksheet['!cols'] = detailsCols;

      // 添加详细信息工作表
      XLSX.utils.book_append_sheet(workbook, detailsWorksheet, '比赛详细信息');

      // 3. 每个场地生成一个独立的比赛安排表
      const courtsSet = new Set(matchesWithNumbers.map(match => match.court));
      const courtsArr = Array.from(courtsSet).sort((a, b) => a - b);
      courtsArr.forEach((court) => {
        // 过滤出该场地的所有比赛，并按时间段排序
        const courtMatches = matchesWithNumbers.filter(match => match.court === court)
          .sort((a, b) => a.timeSlot - b.timeSlot);
        // 生成表头
        const courtSheetData = [
          ['时间段', 'No.', '比赛详情']
        ];
        // 生成每一行
        courtMatches.forEach(match => {
          // 队伍代码
          const teamACode = match.teamA_Id?.charAt?.(match.teamA_Id.length - 1) || 'A';
          const teamBCode = match.teamB_Id?.charAt?.(match.teamB_Id.length - 1) || 'B';
          // 队员编码
          let teamAPlayersStr = '';
          let teamAPlayersNames = '';
          if (match.teamA_Players && match.teamA_Players.length > 0) {
            teamAPlayersStr = match.teamA_Players.join('+');
            teamAPlayersNames = match.teamA_Players.map((playerId: string) => {
              const player = allPlayers.find(p => p.code === playerId);
              return player && player.name ? player.name : `队员${playerId}`;
            }).join('+');
          } else {
            if (match.matchType.includes('1+2') || match.matchType === 'MD1' || match.matchType === 'MD2') {
              teamAPlayersStr = `${teamACode}1+${teamACode}2`;
              teamAPlayersNames = `队员${teamACode}1+队员${teamACode}2`;
            } else if (match.matchType.includes('3+5') || match.matchType === 'XD1') {
              teamAPlayersStr = `${teamACode}3+${teamACode}5`;
              teamAPlayersNames = `队员${teamACode}3+队员${teamACode}5`;
            } else {
              teamAPlayersStr = `${teamACode}?+${teamACode}?`;
              teamAPlayersNames = `队员${teamACode}?+队员${teamACode}?`;
            }
          }
          let teamBPlayersStr = '';
          let teamBPlayersNames = '';
          if (match.teamB_Players && match.teamB_Players.length > 0) {
            teamBPlayersStr = match.teamB_Players.join('+');
            teamBPlayersNames = match.teamB_Players.map((playerId: string) => {
              const player = allPlayers.find(p => p.code === playerId);
              return player && player.name ? player.name : `队员${playerId}`;
            }).join('+');
          } else {
            if (match.matchType.includes('1+2') || match.matchType === 'MD1' || match.matchType === 'MD2') {
              teamBPlayersStr = `${teamBCode}1+${teamBCode}2`;
              teamBPlayersNames = `队员${teamBCode}1+队员${teamBCode}2`;
            } else if (match.matchType.includes('3+5') || match.matchType === 'XD1') {
              teamBPlayersStr = `${teamBCode}3+${teamBCode}5`;
              teamBPlayersNames = `队员${teamBCode}3+队员${teamBCode}5`;
            } else {
              teamBPlayersStr = `${teamBCode}?+${teamBCode}?`;
              teamBPlayersNames = `队员${teamBCode}?+队员${teamBCode}?`;
            }
          }
          // 比赛详情两行
          const matchDetail = `${teamAPlayersStr}:${teamBPlayersStr}\n${teamAPlayersNames}:${teamBPlayersNames}`;
          courtSheetData.push([
            `第${match.timeSlot + 1}时段`,
            match.matchNumber || `---`, // 没有序号显示为---
            matchDetail
          ]);
        });
        // 创建工作表
        const courtSheet = XLSX.utils.aoa_to_sheet(courtSheetData);
        // 设置列宽
        courtSheet['!cols'] = [
          { wch: 10 }, // 时间段
          { wch: 8 },  // No.
          { wch: 40 }  // 比赛详情
        ];
        // 设置行高
        courtSheet['!rows'] = Array(courtSheetData.length).fill({ hpt: 40 });
        // 设置自动换行
        for (let r = 1; r < courtSheetData.length; r++) {
          const cellRef = XLSX.utils.encode_cell({ r, c: 2 });
          if (courtSheet[cellRef]) {
            if (!courtSheet[cellRef].s) courtSheet[cellRef].s = {};
            courtSheet[cellRef].s.alignment = { wrapText: true, vertical: 'top' };
          }
        }
        // 添加到工作簿
        XLSX.utils.book_append_sheet(workbook, courtSheet, `${court}号场地`);
      });

      // 4. 添加计分表 - 用于打印（所有比赛在一个表中）
      // 首先按比赛序号排序
      const sortedMatches = [...matchesWithNumbers].sort((a, b) => {
        const numA = parseInt((a.matchNumber || '0').replace(/\D/g, ''));
        const numB = parseInt((b.matchNumber || '0').replace(/\D/g, ''));
        return numA - numB;
      });

      // 创建单一计分表数据
      const allScoreSheetData: (string | number | null)[][] = [];

      // 处理每场比赛
      sortedMatches.forEach((match, matchIndex) => {
        // 如果不是第一场比赛，添加一个空行作为分隔
        if (matchIndex > 0) {
          allScoreSheetData.push(['', '', '']);
        }

        // 获取队伍代码和队员信息
        const teamACode = match.teamA_Id?.charAt?.(match.teamA_Id.length - 1) || 'A';
        const teamBCode = match.teamB_Id?.charAt?.(match.teamB_Id.length - 1) || 'B';

        // 处理A队队员
        let teamAPlayersStr = '';
        let teamAPlayersNames = '';
        if (match.teamA_Players && match.teamA_Players.length > 0) {
          teamAPlayersStr = match.teamA_Players.join('+');
          teamAPlayersNames = match.teamA_Players.map((playerId: string) => {
            const player = allPlayers.find(p => p.code === playerId);
            return player && player.name ? player.name : `队员${playerId}`;
          }).join('+');
        } else {
          if (match.matchType.includes('1+2') || match.matchType === 'MD1' || match.matchType === 'MD2') {
            teamAPlayersStr = `${teamACode}1+${teamACode}2`;
            teamAPlayersNames = `队员${teamACode}1+队员${teamACode}2`;
          } else if (match.matchType.includes('3+5') || match.matchType === 'XD1') {
            teamAPlayersStr = `${teamACode}3+${teamACode}5`;
            teamAPlayersNames = `队员${teamACode}3+队员${teamACode}5`;
          } else {
            teamAPlayersStr = `${teamACode}?+${teamACode}?`;
            teamAPlayersNames = `队员${teamACode}?+队员${teamACode}?`;
          }
        }

        // 处理B队队员
        let teamBPlayersStr = '';
        let teamBPlayersNames = '';
        if (match.teamB_Players && match.teamB_Players.length > 0) {
          teamBPlayersStr = match.teamB_Players.join('+');
          teamBPlayersNames = match.teamB_Players.map((playerId: string) => {
            const player = allPlayers.find(p => p.code === playerId);
            return player && player.name ? player.name : `队员${playerId}`;
          }).join('+');
        } else {
          if (match.matchType.includes('1+2') || match.matchType === 'MD1' || match.matchType === 'MD2') {
            teamBPlayersStr = `${teamBCode}1+${teamBCode}2`;
            teamBPlayersNames = `队员${teamBCode}1+队员${teamBCode}2`;
          } else if (match.matchType.includes('3+5') || match.matchType === 'XD1') {
            teamBPlayersStr = `${teamBCode}3+${teamBCode}5`;
            teamBPlayersNames = `队员${teamBCode}3+队员${teamBCode}5`;
          } else {
            teamBPlayersStr = `${teamBCode}?+${teamBCode}?`;
            teamBPlayersNames = `队员${teamBCode}?+队员${teamBCode}?`;
          }
        }

        // 表头 - 比赛信息
        allScoreSheetData.push([
          match.matchNumber || `---`,
          teamACode,
          teamBCode
        ]);

        // 第一行 - 比赛编号和队伍信息
        allScoreSheetData.push([
          `${match.court}号场\n第${match.timeSlot + 1}时段`,
          `${teamAPlayersStr}\n${teamAPlayersNames}`,
          `${teamBPlayersStr}\n${teamBPlayersNames}`
        ]);

        // 添加1-21的空行，用于记录比分
        for (let i = 1; i <= 21; i++) {
          allScoreSheetData.push([
            i.toString(),
            '',
            ''
          ]);
        }
      });

      // 创建单一计分表工作表
      const allScoreSheet = XLSX.utils.aoa_to_sheet(allScoreSheetData as any[][]);

      // 设置列宽
      allScoreSheet['!cols'] = [
        { wch: 10 },  // matchnumber列
        { wch: 25 }, // 第一队列
        { wch: 25 }  // 第二队列
      ];

      // 设置所有单元格自动换行
      for (let r = 0; r < allScoreSheetData.length; r++) {
        for (let c = 0; c < 3; c++) {
          const cellRef = XLSX.utils.encode_cell({ r, c });
          if (allScoreSheet[cellRef]) {
            if (!allScoreSheet[cellRef].s) allScoreSheet[cellRef].s = {};
            // 设置所有单元格自动换行
            allScoreSheet[cellRef].s.alignment = {
              wrapText: true,
              vertical: 'top',
              horizontal: c === 0 ? 'center' : 'left' // 第一列居中，其他左对齐
            };
            // 设置边框
            allScoreSheet[cellRef].s.border = {
              top: { style: 'thin' },
              left: { style: 'thin' },
              bottom: { style: 'thin' },
              right: { style: 'thin' }
            };
          }
        }
      }

      // 为队伍信息行设置更大的行高
      const rowHeights = [];
      let currentMatchIndex = 0;

      for (let r = 0; r < allScoreSheetData.length; r++) {
        // 空行
        if (r > 0 && (allScoreSheetData[r][0] as string) === '') {
          rowHeights.push({ hpt: 10 }); // 空行高度较小
          continue;
        }

        // 队伍信息行 (表头的下一行)
        if ((allScoreSheetData[r][0] as string) === 'matchnumber') {
          rowHeights.push({ hpt: 20 }); // 表头高度
          currentMatchIndex = r;
          continue;
        }

        // 队伍信息行
        if (r === currentMatchIndex + 1) {
          rowHeights.push({ hpt: 40 }); // 队伍信息行高度加大
          continue;
        }

        // 其他行 (比分行)
        rowHeights.push({ hpt: 20 });
      }

      allScoreSheet['!rows'] = rowHeights;

      // 添加到工作簿
      XLSX.utils.book_append_sheet(workbook, allScoreSheet, '计分表');

      // 导出Excel文件
      const fileName = `${exportFileName}.xlsx`;
      XLSX.writeFile(workbook, fileName);

      message.success('导出成功！');
      setExportModalVisible(false);
    } catch (error) {
      console.error('导出Excel失败:', error);
      message.error('导出失败，请重试');
    }
  };

  // 处理导出按钮点击
  const handleExportClick = () => {
    setExportFileName('羽毛球比赛列表');
    setExportModalVisible(true);
  };

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

      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <Button.Group>
          <Button
            type={viewMode === 'matrix' ? 'primary' : 'default'}
            icon={<AppstoreOutlined />}
            onClick={() => setViewMode('matrix')}
          >
            矩阵视图
          </Button>
          <Button
            type={viewMode === 'list' ? 'primary' : 'default'}
            icon={<TableOutlined />}
            onClick={() => setViewMode('list')}
          >
            列表视图
          </Button>
        </Button.Group>

        <Button
          type="primary"
          icon={<DownloadOutlined />}
          onClick={handleExportClick}
        >
          导出Excel
        </Button>
      </div>

      {viewMode === 'list' ? (
        <Table
          columns={columns}
          dataSource={matches}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 20,
            showTotal: (total) => `共 ${total} 场比赛`,
          }}
          scroll={{ x: 'max-content' }}
        />
      ) : (
        <MatrixView matches={matches} />
      )}

      <Modal
        title={<div style={{ fontSize: '20px', fontWeight: 'bold' }}>记录比分</div>}
        open={scoreModalVisible}
        onOk={handleSaveScore}
        onCancel={handleScoreModalCancel}
        okText="保存比分"
        cancelText="取消"
        destroyOnClose={true}
        width={760}
        bodyStyle={{ padding: '24px' }}
        okButtonProps={{
          size: 'large',
          style: {
            height: '48px',
            fontSize: '16px',
            padding: '0 25px',
            fontWeight: 'bold'
          }
        }}
        cancelButtonProps={{
          size: 'large',
          style: {
            height: '48px',
            fontSize: '16px',
            padding: '0 25px'
          }
        }}
      >
        {selectedMatch && (
          <Space direction="vertical" style={{ width: '100%' }}>
            <div style={{
              textAlign: 'center',
              margin: '0 0 30px 0',
              padding: '15px',
              backgroundColor: '#f9f9f9',
              borderRadius: '8px',
              fontSize: '24px',
              fontWeight: 'bold'
            }}>
              比分预览: <span style={{ color: '#1890ff' }}>{scores.teamAScore}</span> : <span style={{ color: '#f5222d' }}>{scores.teamBScore}</span>
            </div>

            <div style={{ marginBottom: '30px' }}>
              <div style={{
                fontWeight: 'bold',
                marginBottom: '15px',
                display: 'flex',
                alignItems: 'center',
                fontSize: '18px'
              }}>
                <Tag color="blue" style={{ marginRight: '10px', fontSize: '16px', padding: '4px 10px' }}>
                  {selectedMatch.teamA_Name}
                </Tag>
                <span>得分：</span>
                <span style={{ color: '#1890ff', fontWeight: 'bold', marginLeft: '10px', fontSize: '20px' }}>
                  {scores.teamAScore}
                </span>
              </div>
              <ScoreInput
                value={scores.teamAScore}
                onChange={handleTeamAScoreChange}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <div style={{
                fontWeight: 'bold',
                marginBottom: '15px',
                display: 'flex',
                alignItems: 'center',
                fontSize: '18px'
              }}>
                <Tag color="red" style={{ marginRight: '10px', fontSize: '16px', padding: '4px 10px' }}>
                  {selectedMatch.teamB_Name}
                </Tag>
                <span>得分：</span>
                <span style={{ color: '#f5222d', fontWeight: 'bold', marginLeft: '10px', fontSize: '20px' }}>
                  {scores.teamBScore}
                </span>
              </div>
              <ScoreInput
                value={scores.teamBScore}
                onChange={handleTeamBScoreChange}
              />
            </div>
          </Space>
        )}
      </Modal>

      <Modal
        title="更换参赛队员"
        open={playersModalVisible}
        onOk={handleSavePlayers}
        onCancel={handlePlayersModalCancel}
        okText="保存"
        cancelText="取消"
        width={600}
        destroyOnClose={true}
      >
        {selectedMatch && (
          <Space direction="vertical" style={{ width: '100%' }}>
            {(() => {
              // 定义队伍代码变量供内部使用
              const teamACode = selectedMatch.teamA_Id?.charAt?.(selectedMatch.teamA_Id.length - 1) || 'A';
              const teamBCode = selectedMatch.teamB_Id?.charAt?.(selectedMatch.teamB_Id.length - 1) || 'B';

              return (
                <>
                  <div style={{ marginBottom: 16 }}>
                    <Tag color="blue">{selectedMatch.teamA_Name}</Tag>
                    <Select
                      mode="multiple"
                      style={{ width: '80%' }}
                      placeholder="选择队员"
                      value={selectedTeamAPlayers}
                      onChange={setSelectedTeamAPlayers}
                      optionFilterProp="children"
                    >
                      {(() => {
                        // 生成A队队员列表
                        console.log('A队编码:', teamACode);

                        // 使用比赛统筹配置中的队伍容量
                        const teamCapacity = tournamentConfig?.teamCapacity || 6;
                        console.log('队伍容量:', teamCapacity);

                        // 生成队员选项
                        const options = [];
                        for (let i = 1; i <= teamCapacity; i++) {
                          const playerCode = `${teamACode}${i}`;
                          options.push(
                            <Option key={playerCode} value={playerCode}>
                              {playerCode} - 队员{playerCode}
                            </Option>
                          );
                        }
                        return options;
                      })()}
                    </Select>
                  </div>

                  <div>
                    <Tag color="red">{selectedMatch.teamB_Name}</Tag>
                    <Select
                      mode="multiple"
                      style={{ width: '80%' }}
                      placeholder="选择队员"
                      value={selectedTeamBPlayers}
                      onChange={setSelectedTeamBPlayers}
                      optionFilterProp="children"
                    >
                      {(() => {
                        // 生成B队队员列表
                        console.log('B队编码:', teamBCode);

                        // 使用比赛统筹配置中的队伍容量
                        const teamCapacity = tournamentConfig?.teamCapacity || 6;
                        console.log('队伍容量:', teamCapacity);

                        // 生成队员选项
                        const options = [];
                        for (let i = 1; i <= teamCapacity; i++) {
                          const playerCode = `${teamBCode}${i}`;
                          options.push(
                            <Option key={playerCode} value={playerCode}>
                              {playerCode} - 队员{playerCode}
                            </Option>
                          );
                        }
                        return options;
                      })()}
                    </Select>
                  </div>

                  <div style={{ marginTop: 16 }}>
                    <Alert
                      message="已选择的队员"
                      type="info"
                      description={
                        <div>
                          <div>
                            <Tag color="blue">{selectedMatch.teamA_Name}：</Tag>
                            {selectedTeamAPlayers.map(code => (
                              <Tag key={code} color="cyan">
                                {code} - 队员{code}
                              </Tag>
                            ))}
                            {selectedTeamAPlayers.length === 0 && <span>暂无选择</span>}
                          </div>
                          <div style={{ marginTop: 8 }}>
                            <Tag color="red">{selectedMatch.teamB_Name}：</Tag>
                            {selectedTeamBPlayers.map(code => (
                              <Tag key={code} color="pink">
                                {code} - 队员{code}
                              </Tag>
                            ))}
                            {selectedTeamBPlayers.length === 0 && <span>暂无选择</span>}
                          </div>
                        </div>
                      }
                    />
                  </div>
                </>
              );
            })()}
          </Space>
        )}
      </Modal>

      {/* 导出文件名对话框 */}
      <Modal
        title="导出Excel"
        open={exportModalVisible}
        onOk={exportToExcel}
        onCancel={() => setExportModalVisible(false)}
        okText="导出"
        cancelText="取消"
      >
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 8 }}>文件名：</label>
          <Input
            value={exportFileName}
            onChange={(e) => setExportFileName(e.target.value)}
            placeholder="请输入导出文件名"
            suffix=".xlsx"
          />
        </div>
        <Alert
          message="Excel文件将包含两个表格："
          description={
            <ul style={{ margin: '8px 0 0 0', paddingLeft: 16 }}>
              <li>比赛矩阵：按时间段和场地排列，第一行显示"A1+A2:B1+B2"格式的队员编码，第二行显示对应的队员姓名</li>
              <li>比赛详细信息：包含时间段、场地、队员编码、队员姓名、比赛状态和比分</li>
            </ul>
          }
          type="info"
          showIcon
        />
      </Modal>
    </div>
  );
};

export default MatchList; 
