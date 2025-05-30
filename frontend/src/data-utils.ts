import { Match } from './types';

export function get_consecutive_matches(matches: Match[]): { id: string; player: string; timeSlot1: string; timeSlot2: string }[] {
  // 按时间段分组
  const time_slots: { [key: string]: Match[] } = {};
  for (const match of matches) {
    const time_slot = match.timeSlot;
    if (time_slot !== undefined) {
      if (!time_slots[time_slot]) {
        time_slots[time_slot] = [];
      }
      time_slots[time_slot].push(match);
    }
  }
  
  // 获取所有时间段并排序（转为数字进行排序）
  const sorted_slots = Object.keys(time_slots)
    .map(slot => parseInt(slot, 10))
    .filter(slot => !isNaN(slot))
    .sort((a, b) => a - b)
    .map(slot => slot.toString());
  
  // 检查连续时间段
  const result = [];
  for (let i = 0; i < sorted_slots.length - 1; i++) {
    const current_slot = sorted_slots[i];
    const next_slot = sorted_slots[i + 1];
    
    // 检查是否为相邻时间段（数字相差为1）
    const current_slot_num = parseInt(current_slot, 10);
    const next_slot_num = parseInt(next_slot, 10);
    
    if (next_slot_num - current_slot_num !== 1) {
      continue; // 不是相邻时间段，跳过
    }
    
    // 获取当前时间段和下一个时间段的所有选手
    const current_players = new Set<string>();
    const next_players = new Set<string>();
    
    for (const match of time_slots[current_slot]) {
      // 添加对 teamA_Players 和 teamB_Players 的处理
      if (match.teamA_Players) {
        match.teamA_Players.forEach((player: string) => current_players.add(player));
      }
      if (match.teamB_Players) {
        match.teamB_Players.forEach((player: string) => current_players.add(player));
      }
    }
    
    for (const match of time_slots[next_slot]) {
      // 添加对 teamA_Players 和 teamB_Players 的处理
      if (match.teamA_Players) {
        match.teamA_Players.forEach((player: string) => next_players.add(player));
      }
      if (match.teamB_Players) {
        match.teamB_Players.forEach((player: string) => next_players.add(player));
      }
    }
    
    // 找出在两个时间段都出现的选手
    const common_players = [...current_players].filter(player => next_players.has(player));
    
    for (const player of common_players) {
      result.push({
        id: `${player}_${current_slot}_${next_slot}`,
        player: player,
        timeSlot1: `第${parseInt(current_slot) + 1}时段`,
        timeSlot2: `第${parseInt(next_slot) + 1}时段`
      });
    }
  }
  
  return result;
}

export function get_inactive_players(matches: Match[]): { id: string; player: string; lastMatchTime: string }[] {
  // 获取所有选手
  const all_players = new Set<string>();
  for (const match of matches) {
    // 添加对 teamA_Players 和 teamB_Players 的处理
    if (match.teamA_Players) {
      match.teamA_Players.forEach((player: string) => all_players.add(player));
    }
    if (match.teamB_Players) {
      match.teamB_Players.forEach((player: string) => all_players.add(player));
    }
  }
  
  // 按时间段分组
  const player_last_match: { [key: string]: number } = {};
  
  // 遍历所有比赛，获取每个选手的最后出场时间
  for (const match of matches) {
    if (match.timeSlot !== undefined) {
      const timeSlot = match.timeSlot;
      const playersInMatch: string[] = [];
      
      // 收集所有参与本场比赛的选手
      if (match.teamA_Players) {
        match.teamA_Players.forEach((player: string) => playersInMatch.push(player));
      }
      if (match.teamB_Players) {
        match.teamB_Players.forEach((player: string) => playersInMatch.push(player));
      }
      
      // 更新选手的最后出场时间
      for (const player of playersInMatch) {
        // 如果选手还没有记录，或者当前时间段比已记录的更晚，则更新
        if (player_last_match[player] === undefined || timeSlot > player_last_match[player]) {
          player_last_match[player] = timeSlot;
        }
      }
    }
  }
  
  // 计算当前最新时间段
  const currentMaxTimeSlot = Math.max(...Object.values(player_last_match).filter(slot => !isNaN(slot)), 0);
  
  // 检查每个选手的最后比赛时间
  const result = [];
  for (const player of all_players) {
    const playerStr = player as string;
    const last_match_time = player_last_match[playerStr];
    
    // 如果从未参赛或者距离最新时间段超过3个时间段，则加入结果
    if (last_match_time === undefined || (currentMaxTimeSlot - last_match_time) >= 3) {
      result.push({
        id: `${playerStr}_inactive`,
        player: playerStr,
        lastMatchTime: last_match_time !== undefined ? `第${last_match_time + 1}时段` : '从未参赛'
      });
    }
  }
  
  return result;
}

export function get_group_rankings(matches: Match[]): { id: string; group: string; wins: number; losses: number; winRate: number }[] {
  // 统计每个团体的胜负场次
  const group_stats: { [key: string]: { wins: number, losses: number } } = {};
  
  for (const match of matches) {
    if (match.status === 'finished') {
      // 获取获胜队伍ID
      const winner_TeamId = match.winner_TeamId;
      if (winner_TeamId) {
        // 如果group_stats中没有该队伍，初始化
        if (!group_stats[winner_TeamId]) {
          group_stats[winner_TeamId] = { wins: 0, losses: 0 };
        }
        group_stats[winner_TeamId].wins += 1;
        
        // 获取失败队伍ID并记录负场
        const loser_TeamId = winner_TeamId === match.teamA_Id ? match.teamB_Id : match.teamA_Id;
        if (!group_stats[loser_TeamId]) {
          group_stats[loser_TeamId] = { wins: 0, losses: 0 };
        }
        group_stats[loser_TeamId].losses += 1;
      }
    }
  }
  
  // 计算胜率并排序
  const result = [];
  for (const group in group_stats) {
    const stats = group_stats[group];
    const total = stats.wins + stats.losses;
    const win_rate = total > 0 ? stats.wins / total : 0;
    result.push({
      id: group,
      group: `队伍${group}`, // 格式化团队名称
      wins: stats.wins,
      losses: stats.losses,
      winRate: win_rate
    });
  }
  
  // 按胜率降序排序
  result.sort((a, b) => {
    if (b.winRate !== a.winRate) {
      return b.winRate - a.winRate;
    }
    return b.wins - a.wins;
  });
  
  return result;
}

export function get_player_win_rates(matches: Match[]): { id: string; player: string; wins: number; total: number; winRate: number }[] {
  const player_stats: { [key: string]: { wins: number, total: number } } = {};
  
  for (const match of matches) {
    if (match.status === 'finished') {
      const winner_TeamId = match.winner_TeamId;
      if (winner_TeamId) {
        // 获取胜队和负队的队员
        const winningTeamPlayers = winner_TeamId === match.teamA_Id ? 
          match.teamA_Players : match.teamB_Players;
        const losingTeamPlayers = winner_TeamId === match.teamA_Id ? 
          match.teamB_Players : match.teamA_Players;
        
        // 为所有参赛队员记录总场次
        [...(winningTeamPlayers || []), ...(losingTeamPlayers || [])].forEach((player: string) => {
          if (!player_stats[player]) {
            player_stats[player] = { wins: 0, total: 0 };
          }
          player_stats[player].total += 1;
        });
        
        // 为获胜队员记录胜场
        (winningTeamPlayers || []).forEach((player: string) => {
          player_stats[player].wins += 1;
        });
      }
    }
  }
  
  const result = [];
  for (const player in player_stats) {
    const stats = player_stats[player];
    const win_rate = stats.total > 0 ? stats.wins / stats.total : 0;
    result.push({
      id: player,
      player: player,
      wins: stats.wins,
      total: stats.total,
      winRate: win_rate
    });
  }
  
  // 按胜率降序排序
  result.sort((a, b) => {
    if (b.winRate !== a.winRate) {
      return b.winRate - a.winRate;
    }
    return b.wins - a.wins;
  });
  
  return result;
}

export function get_pair_win_rates(matches: Match[]): { id: string; pair: string; wins: number; total: number; winRate: number }[] {
  const pair_stats: { [key: string]: { wins: number, total: number } } = {};
  
  for (const match of matches) {
    if (match.status === 'finished' && match.winner_TeamId) {
      // 获取胜队和负队的队员
      const winningTeamPlayers = match.winner_TeamId === match.teamA_Id ? 
        match.teamA_Players : match.teamB_Players;
      const losingTeamPlayers = match.winner_TeamId === match.teamA_Id ? 
        match.teamB_Players : match.teamA_Players;
      
      // 为胜队组合记录胜场
      if (winningTeamPlayers && winningTeamPlayers.length === 2) {
        const pairKey = winningTeamPlayers.sort().join('-');
        if (!pair_stats[pairKey]) {
          pair_stats[pairKey] = { wins: 0, total: 0 };
        }
        pair_stats[pairKey].wins += 1;
        pair_stats[pairKey].total += 1;
      }
      
      // 为负队组合记录负场
      if (losingTeamPlayers && losingTeamPlayers.length === 2) {
        const pairKey = losingTeamPlayers.sort().join('-');
        if (!pair_stats[pairKey]) {
          pair_stats[pairKey] = { wins: 0, total: 0 };
        }
        pair_stats[pairKey].total += 1;
      }
    }
  }
  
  const result = [];
  for (const pair in pair_stats) {
    const stats = pair_stats[pair];
    const win_rate = stats.total > 0 ? stats.wins / stats.total : 0;
    result.push({
      id: pair,
      pair: pair.replace('-', ' & '),
      wins: stats.wins,
      total: stats.total,
      winRate: win_rate
    });
  }
  
  // 按胜率降序排序
  result.sort((a, b) => {
    if (b.winRate !== a.winRate) {
      return b.winRate - a.winRate;
    }
    return b.wins - a.wins;
  });
  
  return result;
}

export function get_player_consecutive_matches_count(matches: Match[]): { id: string; player: string; maxConsecutiveMatches: number }[] {
  // 按时间段分组
  const time_slots: { [key: string]: Match[] } = {};
  for (const match of matches) {
    const time_slot = match.timeSlot;
    if (time_slot !== undefined) {
      if (!time_slots[time_slot]) {
        time_slots[time_slot] = [];
      }
      time_slots[time_slot].push(match);
    }
  }
  
  // 获取所有时间段并排序
  const sorted_slots = Object.keys(time_slots)
    .map(slot => parseInt(slot, 10))
    .filter(slot => !isNaN(slot))
    .sort((a, b) => a - b);
  
  // 构建每个时间段的选手参与记录
  const player_participation: { [key: string]: boolean[] } = {};
  
  // 初始化参与记录数组
  const getAllPlayers = () => {
    const allPlayers = new Set<string>();
    for (const match of matches) {
      if (match.teamA_Players) {
        match.teamA_Players.forEach((player: string) => allPlayers.add(player));
      }
      if (match.teamB_Players) {
        match.teamB_Players.forEach((player: string) => allPlayers.add(player));
      }
    }
    return [...allPlayers];
  };
  
  const all_players = getAllPlayers();
  for (const player of all_players) {
    player_participation[player] = Array(sorted_slots.length).fill(false);
  }
  
  // 标记每个选手在每个时间段的参赛情况
  for (let i = 0; i < sorted_slots.length; i++) {
    const slot = sorted_slots[i];
    const slot_matches = time_slots[slot] || [];
    
    for (const match of slot_matches) {
      // 处理队员
      if (match.teamA_Players) {
        match.teamA_Players.forEach((player: string) => {
          if (player_participation[player]) {
            player_participation[player][i] = true;
          }
        });
      }
      if (match.teamB_Players) {
        match.teamB_Players.forEach((player: string) => {
          if (player_participation[player]) {
            player_participation[player][i] = true;
          }
        });
      }
    }
  }
  
  // 计算每个选手的连续参赛次数
  const result = [];
  for (const player in player_participation) {
    const participation = player_participation[player];
    let max_consecutive = 0;
    let current_consecutive = 0;
    
    for (let i = 0; i < participation.length; i++) {
      if (participation[i]) {
        current_consecutive++;
        max_consecutive = Math.max(max_consecutive, current_consecutive);
      } else {
        current_consecutive = 0;
      }
    }
    
    result.push({
      id: player,
      player: player,
      maxConsecutiveMatches: max_consecutive
    });
  }
  
  // 按连续场次降序排序
  result.sort((a, b) => b.maxConsecutiveMatches - a.maxConsecutiveMatches);
  
  return result;
}

export function get_player_consecutive_matches_three(matches: Match[]): { id: string; player: string; timeSlot1: string; timeSlot2: string; timeSlot3: string }[] {
  // 按时间段分组
  const time_slots: { [key: string]: Match[] } = {};
  for (const match of matches) {
    const time_slot = match.timeSlot;
    if (time_slot !== undefined) {
      if (!time_slots[time_slot]) {
        time_slots[time_slot] = [];
      }
      time_slots[time_slot].push(match);
    }
  }
  
  // 获取所有时间段并排序
  const sorted_slots = Object.keys(time_slots)
    .map(slot => parseInt(slot, 10))
    .filter(slot => !isNaN(slot))
    .sort((a, b) => a - b);
  
  // 构建每个时间段的选手参与记录
  const player_participation: { [key: string]: boolean[] } = {};
  
  // 初始化选手记录
  const getAllPlayers = () => {
    const allPlayers = new Set<string>();
    for (const match of matches) {
      if (match.teamA_Players) {
        match.teamA_Players.forEach((player: string) => allPlayers.add(player));
      }
      if (match.teamB_Players) {
        match.teamB_Players.forEach((player: string) => allPlayers.add(player));
      }
    }
    return [...allPlayers];
  };
  
  const all_players = getAllPlayers();
  for (const player of all_players) {
    player_participation[player] = Array(sorted_slots.length).fill(false);
  }
  
  // 标记每个选手在每个时间段的参赛情况
  for (let i = 0; i < sorted_slots.length; i++) {
    const slot = sorted_slots[i];
    const slot_matches = time_slots[slot] || [];
    
    for (const match of slot_matches) {
      if (match.teamA_Players) {
        match.teamA_Players.forEach((player: string) => {
          if (player_participation[player]) {
            player_participation[player][i] = true;
          }
        });
      }
      if (match.teamB_Players) {
        match.teamB_Players.forEach((player: string) => {
          if (player_participation[player]) {
            player_participation[player][i] = true;
          }
        });
      }
    }
  }
  
  // 寻找连续三场比赛的选手
  const result = [];
  for (const player in player_participation) {
    const participation = player_participation[player];
    
    for (let i = 0; i < participation.length - 2; i++) {
      if (participation[i] && participation[i+1] && participation[i+2]) {
        // 找到连续三场参赛
        result.push({
          id: `${player}_3consec_${i}`,
          player: player,
          timeSlot1: `第${sorted_slots[i] + 1}时段`,
          timeSlot2: `第${sorted_slots[i+1] + 1}时段`,
          timeSlot3: `第${sorted_slots[i+2] + 1}时段`
        });
        break; // 只记录一次
      }
    }
  }
  
  return result;
}

export function get_player_consecutive_matches_four(matches: Match[]): { id: string; player: string; timeSlot1: string; timeSlot2: string; timeSlot3: string; timeSlot4: string }[] {
  // 按时间段分组
  const time_slots: { [key: string]: Match[] } = {};
  for (const match of matches) {
    const time_slot = match.timeSlot;
    if (time_slot !== undefined) {
      if (!time_slots[time_slot]) {
        time_slots[time_slot] = [];
      }
      time_slots[time_slot].push(match);
    }
  }
  
  // 获取所有时间段并排序
  const sorted_slots = Object.keys(time_slots)
    .map(slot => parseInt(slot, 10))
    .filter(slot => !isNaN(slot))
    .sort((a, b) => a - b);
  
  // 构建每个时间段的选手参与记录
  const player_participation: { [key: string]: boolean[] } = {};
  
  // 初始化选手记录
  const getAllPlayers = () => {
    const allPlayers = new Set<string>();
    for (const match of matches) {
      if (match.teamA_Players) {
        match.teamA_Players.forEach((player: string) => allPlayers.add(player));
      }
      if (match.teamB_Players) {
        match.teamB_Players.forEach((player: string) => allPlayers.add(player));
      }
    }
    return [...allPlayers];
  };
  
  const all_players = getAllPlayers();
  for (const player of all_players) {
    player_participation[player] = Array(sorted_slots.length).fill(false);
  }
  
  // 标记每个选手在每个时间段的参赛情况
  for (let i = 0; i < sorted_slots.length; i++) {
    const slot = sorted_slots[i];
    const slot_matches = time_slots[slot] || [];
    
    for (const match of slot_matches) {
      if (match.teamA_Players) {
        match.teamA_Players.forEach((player: string) => {
          if (player_participation[player]) {
            player_participation[player][i] = true;
          }
        });
      }
      if (match.teamB_Players) {
        match.teamB_Players.forEach((player: string) => {
          if (player_participation[player]) {
            player_participation[player][i] = true;
          }
        });
      }
    }
  }
  
  // 寻找连续四场比赛的选手
  const result = [];
  for (const player in player_participation) {
    const participation = player_participation[player];
    
    for (let i = 0; i < participation.length - 3; i++) {
      if (participation[i] && participation[i+1] && participation[i+2] && participation[i+3]) {
        // 找到连续四场参赛
        result.push({
          id: `${player}_4consec_${i}`,
          player: player,
          timeSlot1: `第${sorted_slots[i] + 1}时段`,
          timeSlot2: `第${sorted_slots[i+1] + 1}时段`,
          timeSlot3: `第${sorted_slots[i+2] + 1}时段`,
          timeSlot4: `第${sorted_slots[i+3] + 1}时段`
        });
        break; // 只记录一次
      }
    }
  }
  
  return result;
}

export function get_group_point_difference(matches: Match[]): { id: string; group: string; wins: number; losses: number; winRate: number; pointsWon: number; pointsLost: number; pointDiff: number }[] {
  // 统计每个团体的胜负场次和净胜球
  const group_stats: { [key: string]: { wins: number, losses: number, pointsWon: number, pointsLost: number } } = {};
  
  for (const match of matches) {
    if (match.status === 'finished') {
      // 获取获胜队伍ID
      const winner_TeamId = match.winner_TeamId;
      if (winner_TeamId) {
        // 如果group_stats中没有该队伍，初始化
        if (!group_stats[match.teamA_Id]) {
          group_stats[match.teamA_Id] = { wins: 0, losses: 0, pointsWon: 0, pointsLost: 0 };
        }
        if (!group_stats[match.teamB_Id]) {
          group_stats[match.teamB_Id] = { wins: 0, losses: 0, pointsWon: 0, pointsLost: 0 };
        }
        
        // 记录胜负
        if (winner_TeamId === match.teamA_Id) {
          group_stats[match.teamA_Id].wins += 1;
          group_stats[match.teamB_Id].losses += 1;
        } else {
          group_stats[match.teamB_Id].wins += 1;
          group_stats[match.teamA_Id].losses += 1;
        }
        
        // 计算分数
        for (const score of match.scores) {
          group_stats[match.teamA_Id].pointsWon += score.teamAScore;
          group_stats[match.teamA_Id].pointsLost += score.teamBScore;
          group_stats[match.teamB_Id].pointsWon += score.teamBScore;
          group_stats[match.teamB_Id].pointsLost += score.teamAScore;
        }
      }
    }
  }
  
  // 计算胜率和净胜球
  const result = [];
  for (const group in group_stats) {
    const stats = group_stats[group];
    const total = stats.wins + stats.losses;
    const win_rate = total > 0 ? stats.wins / total : 0;
    const pointDiff = stats.pointsWon - stats.pointsLost;
    
    result.push({
      id: group,
      group: `队伍${group}`, // 格式化团队名称
      wins: stats.wins,
      losses: stats.losses,
      winRate: win_rate,
      pointsWon: stats.pointsWon,
      pointsLost: stats.pointsLost,
      pointDiff: pointDiff
    });
  }
  
  // 按胜率降序排序，胜率相同则按净胜球排序
  result.sort((a, b) => {
    if (b.winRate !== a.winRate) {
      return b.winRate - a.winRate;
    }
    return b.pointDiff - a.pointDiff;
  });
  
  return result;
}

export function get_player_point_difference(matches: Match[]): { id: string; player: string; wins: number; total: number; winRate: number; pointsWon: number; pointsLost: number; pointDiff: number }[] {
  // 统计每个选手的胜负场次和净胜球
  const player_stats: { [key: string]: { wins: number, total: number, pointsWon: number, pointsLost: number } } = {};
  
  for (const match of matches) {
    if (match.status === 'finished') {
      const winner_TeamId = match.winner_TeamId;
      if (winner_TeamId) {
        // 获取胜队和负队的队员
        const winningTeamPlayers = winner_TeamId === match.teamA_Id ? 
          match.teamA_Players : match.teamB_Players;
        const losingTeamPlayers = winner_TeamId === match.teamA_Id ? 
          match.teamB_Players : match.teamA_Players;
        
        // 为所有参赛队员记录总场次
        [...(winningTeamPlayers || []), ...(losingTeamPlayers || [])].forEach((player: string) => {
          if (!player_stats[player]) {
            player_stats[player] = { wins: 0, total: 0, pointsWon: 0, pointsLost: 0 };
          }
          player_stats[player].total += 1;
        });
        
        // 为获胜队员记录胜场
        (winningTeamPlayers || []).forEach((player: string) => {
          player_stats[player].wins += 1;
        });
        
        // 计算每个选手的得分和失分
        for (const score of match.scores) {
          // 计算胜队选手的得分和失分
          (winningTeamPlayers || []).forEach((player: string) => {
            if (winner_TeamId === match.teamA_Id) {
              player_stats[player].pointsWon += score.teamAScore;
              player_stats[player].pointsLost += score.teamBScore;
            } else {
              player_stats[player].pointsWon += score.teamBScore;
              player_stats[player].pointsLost += score.teamAScore;
            }
          });
          
          // 计算负队选手的得分和失分
          (losingTeamPlayers || []).forEach((player: string) => {
            if (winner_TeamId === match.teamA_Id) {
              player_stats[player].pointsWon += score.teamBScore;
              player_stats[player].pointsLost += score.teamAScore;
            } else {
              player_stats[player].pointsWon += score.teamAScore;
              player_stats[player].pointsLost += score.teamBScore;
            }
          });
        }
      }
    }
  }
  
  // 计算胜率和净胜球
  const result = [];
  for (const player in player_stats) {
    const stats = player_stats[player];
    const win_rate = stats.total > 0 ? stats.wins / stats.total : 0;
    const pointDiff = stats.pointsWon - stats.pointsLost;
    
    result.push({
      id: player,
      player: player,
      wins: stats.wins,
      total: stats.total,
      winRate: win_rate,
      pointsWon: stats.pointsWon,
      pointsLost: stats.pointsLost,
      pointDiff: pointDiff
    });
  }
  
  // 按胜率降序排序，胜率相同则按净胜球排序
  result.sort((a, b) => {
    if (b.winRate !== a.winRate) {
      return b.winRate - a.winRate;
    }
    return b.pointDiff - a.pointDiff;
  });
  
  return result;
}

export function get_pair_point_difference(matches: Match[]): { id: string; pair: string; wins: number; total: number; winRate: number; pointsWon: number; pointsLost: number; pointDiff: number }[] {
  // 统计每个组合的胜负场次和净胜球
  const pair_stats: { [key: string]: { wins: number, total: number, pointsWon: number, pointsLost: number } } = {};
  
  for (const match of matches) {
    if (match.status === 'finished' && match.winner_TeamId) {
      // 获取胜队和负队的队员
      const winningTeamPlayers = match.winner_TeamId === match.teamA_Id ? 
        match.teamA_Players : match.teamB_Players;
      const losingTeamPlayers = match.winner_TeamId === match.teamA_Id ? 
        match.teamB_Players : match.teamA_Players;
      
      // 只处理双打组合（两个队员）
      if (winningTeamPlayers && winningTeamPlayers.length === 2) {
        const pairKey = winningTeamPlayers.sort().join('-');
        if (!pair_stats[pairKey]) {
          pair_stats[pairKey] = { wins: 0, total: 0, pointsWon: 0, pointsLost: 0 };
        }
        pair_stats[pairKey].wins += 1;
        pair_stats[pairKey].total += 1;
        
        // 计算得分和失分
        for (const score of match.scores) {
          if (match.winner_TeamId === match.teamA_Id) {
            pair_stats[pairKey].pointsWon += score.teamAScore;
            pair_stats[pairKey].pointsLost += score.teamBScore;
          } else {
            pair_stats[pairKey].pointsWon += score.teamBScore;
            pair_stats[pairKey].pointsLost += score.teamAScore;
          }
        }
      }
      
      // 处理负队组合
      if (losingTeamPlayers && losingTeamPlayers.length === 2) {
        const pairKey = losingTeamPlayers.sort().join('-');
        if (!pair_stats[pairKey]) {
          pair_stats[pairKey] = { wins: 0, total: 0, pointsWon: 0, pointsLost: 0 };
        }
        pair_stats[pairKey].total += 1;
        
        // 计算得分和失分
        for (const score of match.scores) {
          if (match.winner_TeamId === match.teamA_Id) {
            pair_stats[pairKey].pointsWon += score.teamBScore;
            pair_stats[pairKey].pointsLost += score.teamAScore;
          } else {
            pair_stats[pairKey].pointsWon += score.teamAScore;
            pair_stats[pairKey].pointsLost += score.teamBScore;
          }
        }
      }
    }
  }
  
  // 计算胜率和净胜球
  const result = [];
  for (const pair in pair_stats) {
    const stats = pair_stats[pair];
    const win_rate = stats.total > 0 ? stats.wins / stats.total : 0;
    const pointDiff = stats.pointsWon - stats.pointsLost;
    
    result.push({
      id: pair,
      pair: pair.replace('-', ' & '),
      wins: stats.wins,
      total: stats.total,
      winRate: win_rate,
      pointsWon: stats.pointsWon,
      pointsLost: stats.pointsLost,
      pointDiff: pointDiff
    });
  }
  
  // 按胜率降序排序，胜率相同则按净胜球排序
  result.sort((a, b) => {
    if (b.winRate !== a.winRate) {
      return b.winRate - a.winRate;
    }
    return b.pointDiff - a.pointDiff;
  });
  
  return result;
} 