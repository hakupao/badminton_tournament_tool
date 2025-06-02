import React, { useState, useEffect } from 'react';
import { Table, Tag, Button, Modal, InputNumber, Space, message, Empty, Select, Alert, Card, Input } from 'antd';
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

  const handleEditPlayers = (match: Match) => {
    console.log('选择的比赛:', match);
    setSelectedMatch(match);
    
    // 提取队伍代码
    const teamACode = match.teamA_Id?.charAt?.(match.teamA_Id.length - 1) || 'A';
    const teamBCode = match.teamB_Id?.charAt?.(match.teamB_Id.length - 1) || 'B';
    
    console.log('队伍代码:', teamACode, teamBCode);
    console.log('比赛类型:', match.matchType);
    console.log('比赛统筹配置:', tournamentConfig);
    
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
    setPlayersModalVisible(true);
  };

  const handleSavePlayers = () => {
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

      setMatches(updatedMatches);
      setGlobalMatches(updatedMatches);
      localStorage.setItem('tournamentMatches', JSON.stringify(updatedMatches));
      
      message.success('参赛选手已更新');
      setPlayersModalVisible(false);
    } catch (error) {
      message.error('更新参赛选手失败');
      console.error('更新参赛选手错误:', error);
    }
  };

  // 获取队员显示名称
  const getPlayerDisplayName = (playerId: string) => {
    const player = allPlayers.find(p => p.code === playerId);
    if (player && player.name) {
      return `${playerId} - ${player.name}`;
    }
    return playerId;
  };

  // 生成对阵双方队员名单的显示
  const renderPlayerNames = (match: Match) => {
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
      title: '参赛队员',
      key: 'players',
      render: (record: Match) => renderPlayerNames(record),
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
    const matrixData = generateMatrixData(matches);
    const courts = [...new Set(matches.map(match => match.court))].sort((a, b) => a - b);
    
    const styles = {
      matrixView: {
        backgroundColor: '#f0f2f5',
        padding: '20px',
        borderRadius: '8px',
        boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
      },
      timeSlotContainer: {
        marginBottom: '30px'
      },
      timeSlotTitle: {
        backgroundColor: '#fff',
        padding: '10px 15px',
        fontWeight: 'bold' as const,
        borderRadius: '4px',
        marginBottom: '16px',
        boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
        fontSize: '16px'
      },
      matchesRow: {
        display: 'flex',
        flexWrap: 'nowrap' as const,
        gap: '12px',
        overflowX: 'auto' as const,
        padding: '4px 0 8px 0'
      },
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
      courtTitle: {
        fontWeight: 'bold' as const,
        textAlign: 'center' as const,
        marginBottom: '8px',
        color: '#1890ff'
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
      },
      emptyMatch: {
        height: '200px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fafafa',
        border: '1px dashed #d9d9d9',
        borderRadius: '4px',
        color: '#999',
        fontSize: '14px'
      },
      matchContainer: {
        flex: '1 0 0',
        minWidth: '160px',
        padding: '0 4px'
      }
    };
    
    return (
      <div style={styles.matrixView}>
        {/* 按时间段组织显示 */}
        {matrixData.map((row: MatrixRowData, index: number) => (
          <div key={index} style={styles.timeSlotContainer}>
            {/* 时间段标题 */}
            <div style={styles.timeSlotTitle}>
              第{row.timeSlot + 1}时段
            </div>
            
            {/* 该时间段的所有比赛 */}
            <div style={styles.matchesRow}>
              {courts.map(court => (
                <div key={court} style={styles.matchContainer}>
                  <div style={styles.courtTitle}>{court}号场地</div>
                  {row[`court${court}`] ? 
                    <Card 
                      size="small" 
                      style={styles.matchCard} 
                      title={getMatchTypeName(row[`court${court}`].matchType)}
                      headStyle={styles.matchCardTitle}
                    >
                      <div style={styles.matchContent}>
                        <div>
                          <div style={styles.teams}>
                            <Tag color="blue">{row[`court${court}`].teamA_Name}</Tag>
                            <span>VS</span>
                            <Tag color="red">{row[`court${court}`].teamB_Name}</Tag>
                          </div>
                          <div>{renderPlayerNames(row[`court${court}`])}</div>
                          <div style={{textAlign: 'center'}}>{getStatusTag(row[`court${court}`].status)}</div>
                        </div>
                        <div style={styles.buttonGroup}>
                          <Button
                            size="small"
                            type="primary"
                            icon={<EditOutlined />}
                            onClick={() => handleEditScore(row[`court${court}`])}
                            style={styles.actionButton}
                          >
                            记录比分
                          </Button>
                          <Button
                            size="small"
                            type="default"
                            icon={<UserSwitchOutlined />}
                            onClick={() => handleEditPlayers(row[`court${court}`])}
                            style={styles.actionButton}
                          >
                            更换队员
                          </Button>
                        </div>
                      </div>
                    </Card>
                    : <div style={styles.emptyMatch}>未安排比赛</div>
                  }
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  // 导出矩阵视图为Excel
  const exportToExcel = () => {
    try {
      // 获取矩阵数据
      const matrixData = generateMatrixData(matches);
      
      // 获取所有场地
      const courts = [...new Set(matches.map(match => match.court))].sort((a, b) => a - b);
      
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
          const cellRef = XLSX.utils.encode_cell({r: r, c: c});
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
        '时间段', 
        '场地', 
        '对阵队员编码',
        '队员姓名',
        '比赛状态', 
        '比分'
      ]);
      
      // 添加比赛数据
      matches.sort((a, b) => {
        // 先按时间段排序
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
        />
      ) : (
        <MatrixView matches={matches} />
      )}
      
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

      <Modal
        title="更换参赛队员"
        open={playersModalVisible}
        onOk={handleSavePlayers}
        onCancel={() => setPlayersModalVisible(false)}
        okText="保存"
        cancelText="取消"
        width={600}
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