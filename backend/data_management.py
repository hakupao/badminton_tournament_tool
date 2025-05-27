from typing import List, Dict, Any
from datetime import datetime, timedelta
from collections import defaultdict

def get_consecutive_matches(matches: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """获取在连续两个时间段都比赛的选手"""
    # 按时间段分组
    time_slots = defaultdict(list)
    for match in matches:
        time_slot = match.get('timeSlot')
        if time_slot:
            time_slots[time_slot].append(match)
    
    # 获取所有时间段并排序
    sorted_slots = sorted(time_slots.keys())
    
    # 检查连续时间段
    result = []
    for i in range(len(sorted_slots) - 1):
        current_slot = sorted_slots[i]
        next_slot = sorted_slots[i + 1]
        
        # 获取当前时间段和下一个时间段的所有选手
        current_players = set()
        next_players = set()
        
        for match in time_slots[current_slot]:
            current_players.update(match.get('players', []))
        
        for match in time_slots[next_slot]:
            next_players.update(match.get('players', []))
        
        # 找出在两个时间段都出现的选手
        common_players = current_players.intersection(next_players)
        
        for player in common_players:
            result.append({
                'id': f"{player}_{current_slot}_{next_slot}",
                'player': player,
                'timeSlot1': current_slot,
                'timeSlot2': next_slot
            })
    
    return result

def get_inactive_players(matches: List[Dict[str, Any]], time_slots: List[str]) -> List[Dict[str, Any]]:
    """获取在连续三个时间段都没有参加比赛的选手"""
    # 获取所有选手
    all_players = set()
    for match in matches:
        all_players.update(match.get('players', []))
    
    # 按时间段分组
    player_last_match = defaultdict(lambda: -1)
    for i, time_slot in enumerate(time_slots):
        for match in matches:
            if match.get('timeSlot') == time_slot:
                for player in match.get('players', []):
                    player_last_match[player] = i
    
    # 检查每个选手的最后比赛时间
    result = []
    for player in all_players:
        last_match_index = player_last_match[player]
        if last_match_index == -1 or last_match_index <= len(time_slots) - 3:
            result.append({
                'id': f"{player}_inactive",
                'player': player,
                'lastMatchTime': time_slots[last_match_index] if last_match_index != -1 else '从未参赛'
            })
    
    return result

def get_group_rankings(matches: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """获取循环赛中每个团体的实时排名"""
    # 统计每个团体的胜负场次
    group_stats = defaultdict(lambda: {'wins': 0, 'losses': 0})
    
    for match in matches:
        if match.get('status') == 'completed':
            winner = match.get('winner')
            if winner:
                group_stats[winner]['wins'] += 1
                for group in match.get('groups', []):
                    if group != winner:
                        group_stats[group]['losses'] += 1
    
    # 计算胜率并排序
    result = []
    for group, stats in group_stats.items():
        total = stats['wins'] + stats['losses']
        win_rate = stats['wins'] / total if total > 0 else 0
        result.append({
            'id': group,
            'group': group,
            'wins': stats['wins'],
            'losses': stats['losses'],
            'winRate': win_rate
        })
    
    # 按胜率降序排序
    result.sort(key=lambda x: (-x['winRate'], -x['wins']))
    return result

def get_player_win_rates(matches: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """获取每个参加比赛的选手的胜率"""
    player_stats = defaultdict(lambda: {'wins': 0, 'total': 0})
    
    for match in matches:
        if match.get('status') == 'completed':
            winner = match.get('winner')
            if winner:
                for player in match.get('players', []):
                    player_stats[player]['total'] += 1
                    if player in match.get('winningPlayers', []):
                        player_stats[player]['wins'] += 1
    
    result = []
    for player, stats in player_stats.items():
        win_rate = stats['wins'] / stats['total'] if stats['total'] > 0 else 0
        result.append({
            'id': player,
            'player': player,
            'wins': stats['wins'],
            'total': stats['total'],
            'winRate': win_rate
        })
    
    # 按胜率降序排序
    result.sort(key=lambda x: (-x['winRate'], -x['wins']))
    return result

def get_pair_win_rates(matches: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """获取每个组合的胜率"""
    pair_stats = defaultdict(lambda: {'wins': 0, 'total': 0})
    
    for match in matches:
        if match.get('status') == 'completed':
            # 获取比赛中的所有组合
            pairs = []
            players = match.get('players', [])
            for i in range(0, len(players), 2):
                if i + 1 < len(players):
                    pairs.append(tuple(sorted([players[i], players[i + 1]])))
            
            winner = match.get('winner')
            if winner:
                for pair in pairs:
                    pair_stats[pair]['total'] += 1
                    if pair in [tuple(sorted(p)) for p in match.get('winningPairs', [])]:
                        pair_stats[pair]['wins'] += 1
    
    result = []
    for pair, stats in pair_stats.items():
        win_rate = stats['wins'] / stats['total'] if stats['total'] > 0 else 0
        result.append({
            'id': '_'.join(pair),
            'pair': ' & '.join(pair),
            'wins': stats['wins'],
            'total': stats['total'],
            'winRate': win_rate
        })
    
    # 按胜率降序排序
    result.sort(key=lambda x: (-x['winRate'], -x['wins']))
    return result 