export function get_consecutive_matches(matches: any[]): any[] {
  // 按时间段分组
  const time_slots: { [key: string]: any[] } = {};
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
      // 同时检查 players 和 teamA_Players/teamB_Players
      if (match.players) {
        match.players.forEach((player: string) => current_players.add(player));
      }
      // 添加对 teamA_Players 和 teamB_Players 的处理
      if (match.teamA_Players) {
        match.teamA_Players.forEach((player: string) => current_players.add(player));
      }
      if (match.teamB_Players) {
        match.teamB_Players.forEach((player: string) => current_players.add(player));
      }
    }
    
    for (const match of time_slots[next_slot]) {
      // 同时检查 players 和 teamA_Players/teamB_Players
      if (match.players) {
        match.players.forEach((player: string) => next_players.add(player));
      }
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

export function get_inactive_players(matches: any[], time_slots: string[]): any[] {
  // 获取所有选手
  const all_players = new Set();
  for (const match of matches) {
    // 同时检查 players 和 teamA_Players/teamB_Players
    if (match.players) {
      match.players.forEach((player: string) => all_players.add(player));
    }
    // 添加对 teamA_Players 和 teamB_Players 的处理
    if (match.teamA_Players) {
      match.teamA_Players.forEach((player: string) => all_players.add(player));
    }
    if (match.teamB_Players) {
      match.teamB_Players.forEach((player: string) => all_players.add(player));
    }
  }
  
  // 提取数字时间段ID
  const timeSlotNumbers = time_slots.map(slot => {
    const match = slot.match(/第(\d+)时段/);
    return match ? parseInt(match[1], 10) : -1;
  }).filter(num => num !== -1);
  
  // 按时间段分组
  const player_last_match: { [key: string]: number } = {};
  
  // 遍历所有比赛，获取每个选手的最后出场时间
  for (const match of matches) {
    if (match.timeSlot !== undefined) {
      const timeSlot = match.timeSlot;
      const playersInMatch: string[] = [];
      
      // 收集所有参与本场比赛的选手
      if (match.players) {
        match.players.forEach((player: string) => playersInMatch.push(player));
      }
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

export function get_group_rankings(matches: any[]): any[] {
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

export function get_player_win_rates(matches: any[]): any[] {
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

export function get_pair_win_rates(matches: any[]): any[] {
  const pair_stats: { [key: string]: { wins: number, total: number } } = {};
  
  for (const match of matches) {
    if (match.status === 'finished') {
      const winner_TeamId = match.winner_TeamId;
      if (winner_TeamId) {
        // 获取队A队员
        const teamA_Players = match.teamA_Players || [];
        // 按两人一组生成队A的组合
        for (let i = 0; i < teamA_Players.length; i += 2) {
          if (i + 1 < teamA_Players.length) {
            const pair = [teamA_Players[i], teamA_Players[i + 1]].sort().join('_');
            if (!pair_stats[pair]) {
              pair_stats[pair] = { wins: 0, total: 0 };
            }
            pair_stats[pair].total += 1;
            
            // 如果队A获胜，记录胜场
            if (winner_TeamId === match.teamA_Id) {
              pair_stats[pair].wins += 1;
            }
          }
        }
        
        // 获取队B队员
        const teamB_Players = match.teamB_Players || [];
        // 按两人一组生成队B的组合
        for (let i = 0; i < teamB_Players.length; i += 2) {
          if (i + 1 < teamB_Players.length) {
            const pair = [teamB_Players[i], teamB_Players[i + 1]].sort().join('_');
            if (!pair_stats[pair]) {
              pair_stats[pair] = { wins: 0, total: 0 };
            }
            pair_stats[pair].total += 1;
            
            // 如果队B获胜，记录胜场
            if (winner_TeamId === match.teamB_Id) {
              pair_stats[pair].wins += 1;
            }
          }
        }
      }
    }
  }
  
  const result = [];
  for (const pair_key in pair_stats) {
    const stats = pair_stats[pair_key];
    const win_rate = stats.total > 0 ? stats.wins / stats.total : 0;
    const pair_members = pair_key.split('_');
    result.push({
      id: pair_key,
      pair: pair_members.join(' & '),
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

export function get_player_consecutive_matches_count(matches: any[]): any[] {
  // 按时间段分组
  const time_slots: { [key: string]: any[] } = {};
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
      if (match.players) {
        match.players.forEach((player: string) => allPlayers.add(player));
      }
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
  
  // 标记每个选手在每个时间段的参与情况
  for (let i = 0; i < sorted_slots.length; i++) {
    const slot = sorted_slots[i];
    const slot_matches = time_slots[slot.toString()];
    
    for (const match of slot_matches) {
      // 收集所有参与该比赛的选手
      const players_in_match: Set<string> = new Set();
      
      if (match.players) {
        match.players.forEach((player: string) => players_in_match.add(player));
      }
      if (match.teamA_Players) {
        match.teamA_Players.forEach((player: string) => players_in_match.add(player));
      }
      if (match.teamB_Players) {
        match.teamB_Players.forEach((player: string) => players_in_match.add(player));
      }
      
      // 更新参与记录
      for (const player of players_in_match) {
        if (player_participation[player]) {
          player_participation[player][i] = true;
        }
      }
    }
  }
  
  // 计算每个选手的最长连续比赛次数
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
  
  // 按连续比赛次数降序排序
  return result.sort((a, b) => b.maxConsecutiveMatches - a.maxConsecutiveMatches);
}

export function get_player_consecutive_matches_three(matches: any[]): any[] {
  // 按时间段分组
  const time_slots: { [key: string]: any[] } = {};
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
    .sort((a, b) => a - b);
  
  // 如果时间段不足3个，返回空结果
  if (sorted_slots.length < 3) {
    return [];
  }
  
  const result: Array<{
    id: string;
    player: string;
    timeSlot1: string;
    timeSlot2: string;
    timeSlot3: string;
  }> = [];
  
  // 遍历所有可能的连续三个时间段
  for (let i = 0; i < sorted_slots.length - 2; i++) {
    const slot1 = sorted_slots[i];
    const slot2 = sorted_slots[i + 1];
    const slot3 = sorted_slots[i + 2];
    
    // 检查是否为连续三个时间段
    if (slot2 - slot1 !== 1 || slot3 - slot2 !== 1) {
      continue; // 不是连续的，跳过
    }
    
    // 获取三个时间段中的所有参赛选手
    const players_slot1 = new Set<string>();
    const players_slot2 = new Set<string>();
    const players_slot3 = new Set<string>();
    
    // 收集第一个时间段的参赛选手
    for (const match of time_slots[slot1.toString()]) {
      if (match.players) {
        match.players.forEach((player: string) => players_slot1.add(player));
      }
      if (match.teamA_Players) {
        match.teamA_Players.forEach((player: string) => players_slot1.add(player));
      }
      if (match.teamB_Players) {
        match.teamB_Players.forEach((player: string) => players_slot1.add(player));
      }
    }
    
    // 收集第二个时间段的参赛选手
    for (const match of time_slots[slot2.toString()]) {
      if (match.players) {
        match.players.forEach((player: string) => players_slot2.add(player));
      }
      if (match.teamA_Players) {
        match.teamA_Players.forEach((player: string) => players_slot2.add(player));
      }
      if (match.teamB_Players) {
        match.teamB_Players.forEach((player: string) => players_slot2.add(player));
      }
    }
    
    // 收集第三个时间段的参赛选手
    for (const match of time_slots[slot3.toString()]) {
      if (match.players) {
        match.players.forEach((player: string) => players_slot3.add(player));
      }
      if (match.teamA_Players) {
        match.teamA_Players.forEach((player: string) => players_slot3.add(player));
      }
      if (match.teamB_Players) {
        match.teamB_Players.forEach((player: string) => players_slot3.add(player));
      }
    }
    
    // 找出三个时间段都参赛的选手
    for (const player of players_slot1) {
      if (players_slot2.has(player) && players_slot3.has(player)) {
        // 避免重复添加同一选手
        if (!result.some(item => item.player === player)) {
          result.push({
            id: `${player}_consecutive_three`,
            player: player,
            timeSlot1: `第${slot1 + 1}时段`,
            timeSlot2: `第${slot2 + 1}时段`,
            timeSlot3: `第${slot3 + 1}时段`
          });
        }
      }
    }
  }
  
  return result;
}

export function get_player_consecutive_matches_four(matches: any[]): any[] {
  // 按时间段分组
  const time_slots: { [key: string]: any[] } = {};
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
    .sort((a, b) => a - b);
  
  // 如果时间段不足4个，返回空结果
  if (sorted_slots.length < 4) {
    return [];
  }
  
  const result: Array<{
    id: string;
    player: string;
    timeSlot1: string;
    timeSlot2: string;
    timeSlot3: string;
    timeSlot4: string;
  }> = [];
  
  // 遍历所有可能的连续四个时间段
  for (let i = 0; i < sorted_slots.length - 3; i++) {
    const slot1 = sorted_slots[i];
    const slot2 = sorted_slots[i + 1];
    const slot3 = sorted_slots[i + 2];
    const slot4 = sorted_slots[i + 3];
    
    // 检查是否为连续四个时间段
    if (slot2 - slot1 !== 1 || slot3 - slot2 !== 1 || slot4 - slot3 !== 1) {
      continue; // 不是连续的，跳过
    }
    
    // 获取四个时间段中的所有参赛选手
    const players_slot1 = new Set<string>();
    const players_slot2 = new Set<string>();
    const players_slot3 = new Set<string>();
    const players_slot4 = new Set<string>();
    
    // 收集第一个时间段的参赛选手
    for (const match of time_slots[slot1.toString()]) {
      if (match.players) {
        match.players.forEach((player: string) => players_slot1.add(player));
      }
      if (match.teamA_Players) {
        match.teamA_Players.forEach((player: string) => players_slot1.add(player));
      }
      if (match.teamB_Players) {
        match.teamB_Players.forEach((player: string) => players_slot1.add(player));
      }
    }
    
    // 收集第二个时间段的参赛选手
    for (const match of time_slots[slot2.toString()]) {
      if (match.players) {
        match.players.forEach((player: string) => players_slot2.add(player));
      }
      if (match.teamA_Players) {
        match.teamA_Players.forEach((player: string) => players_slot2.add(player));
      }
      if (match.teamB_Players) {
        match.teamB_Players.forEach((player: string) => players_slot2.add(player));
      }
    }
    
    // 收集第三个时间段的参赛选手
    for (const match of time_slots[slot3.toString()]) {
      if (match.players) {
        match.players.forEach((player: string) => players_slot3.add(player));
      }
      if (match.teamA_Players) {
        match.teamA_Players.forEach((player: string) => players_slot3.add(player));
      }
      if (match.teamB_Players) {
        match.teamB_Players.forEach((player: string) => players_slot3.add(player));
      }
    }
    
    // 收集第四个时间段的参赛选手
    for (const match of time_slots[slot4.toString()]) {
      if (match.players) {
        match.players.forEach((player: string) => players_slot4.add(player));
      }
      if (match.teamA_Players) {
        match.teamA_Players.forEach((player: string) => players_slot4.add(player));
      }
      if (match.teamB_Players) {
        match.teamB_Players.forEach((player: string) => players_slot4.add(player));
      }
    }
    
    // 找出四个时间段都参赛的选手
    for (const player of players_slot1) {
      if (players_slot2.has(player) && players_slot3.has(player) && players_slot4.has(player)) {
        // 避免重复添加同一选手
        if (!result.some(item => item.player === player)) {
          result.push({
            id: `${player}_consecutive_four`,
            player: player,
            timeSlot1: `第${slot1 + 1}时段`,
            timeSlot2: `第${slot2 + 1}时段`,
            timeSlot3: `第${slot3 + 1}时段`,
            timeSlot4: `第${slot4 + 1}时段`
          });
        }
      }
    }
  }
  
  return result;
} 