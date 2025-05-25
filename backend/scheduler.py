from typing import List, Dict, Set, Tuple, Optional
from collections import defaultdict
from itertools import combinations
import random

class ScheduleGenerator:
    """MVP版本的赛程生成器 - 使用贪心算法"""
    
    def __init__(self, courts_count: int = 4):
        self.courts_count = courts_count
        self.match_types = ['MD1', 'MD2', 'XD1']  # MVP固定3个项目
        
    def generate_round_robin_schedule(self, teams: List[Dict], formations: Dict[str, List[Dict]]) -> Tuple[List[Dict], int, int]:
        """
        生成循环赛赛程
        
        Args:
            teams: 队伍列表
            formations: {team_id: [formation1, formation2, ...]}
            
        Returns:
            (matches, total_rounds, total_time_slots)
        """
        # 1. 生成所有团体对抗
        team_ids = [team['id'] for team in teams]
        team_encounters = list(combinations(team_ids, 2))
        
        # 2. 为每个团体对抗生成具体比赛
        all_matches = []
        for team_a_id, team_b_id in team_encounters:
            for match_type in self.match_types:
                # 获取双方阵容
                team_a_formation = self._get_formation_by_type(formations.get(team_a_id, []), match_type)
                team_b_formation = self._get_formation_by_type(formations.get(team_b_id, []), match_type)
                
                if not team_a_formation or not team_b_formation:
                    continue  # 跳过没有配置阵容的比赛
                
                match = {
                    'teamA_Id': team_a_id,
                    'teamB_Id': team_b_id,
                    'matchType': match_type,
                    'teamA_Players': team_a_formation['playerIds'],
                    'teamB_Players': team_b_formation['playerIds'],
                    'status': 'pending'
                }
                all_matches.append(match)
        
        # 3. 分配时间段和场地
        scheduled_matches = self._assign_time_slots_and_courts(all_matches)
        
        # 4. 计算总轮次和时间段
        if scheduled_matches:
            total_time_slots = max(m['timeSlot'] for m in scheduled_matches) + 1
            total_rounds = len(team_encounters)
        else:
            total_time_slots = 0
            total_rounds = 0
        
        return scheduled_matches, total_rounds, total_time_slots
    
    def _get_formation_by_type(self, formations: List[Dict], match_type: str) -> Optional[Dict]:
        """获取特定类型的阵容"""
        for formation in formations:
            if formation['type'] == match_type:
                return formation
        return None
    
    def _assign_time_slots_and_courts(self, matches: List[Dict]) -> List[Dict]:
        """
        分配时间段和场地 - MVP版本的贪心算法
        
        核心约束：
        1. 同一时间段，一个选手只能参加一场比赛
        2. 尽量避免选手连续比赛
        """
        scheduled_matches = []
        time_slot = 0
        
        # 按团体对抗分组（同一对抗的3场比赛尽量安排在一起）
        encounter_groups = defaultdict(list)
        for match in matches:
            key = tuple(sorted([match['teamA_Id'], match['teamB_Id']]))
            encounter_groups[key].append(match)
        
        # 记录每个选手的最后比赛时间
        player_last_slot = {}
        
        # 逐个时间段安排比赛
        remaining_groups = list(encounter_groups.values())
        
        while remaining_groups:
            # 当前时间段已安排的比赛
            current_slot_matches = []
            current_slot_players = set()
            courts_used = 0
            
            # 尝试在当前时间段安排尽可能多的比赛
            groups_to_remove = []
            
            for group_idx, group in enumerate(remaining_groups):
                for match in group[:]:  # 遍历组内还未安排的比赛
                    # 检查选手是否冲突
                    match_players = set(match['teamA_Players'] + match['teamB_Players'])
                    
                    if not match_players & current_slot_players and courts_used < self.courts_count:
                        # 检查选手是否刚刚比赛过（软约束）
                        recent_players = [p for p in match_players if player_last_slot.get(p, -10) == time_slot - 1]
                        
                        # 如果没有选手刚比赛过，或者已经没有更好的选择，就安排这场比赛
                        if not recent_players or courts_used == 0:
                            # 分配场地
                            match['timeSlot'] = time_slot
                            match['court'] = courts_used + 1
                            match['round'] = time_slot // 3 + 1  # 简单计算轮次
                            
                            current_slot_matches.append(match)
                            current_slot_players.update(match_players)
                            courts_used += 1
                            
                            # 更新选手最后比赛时间
                            for player in match_players:
                                player_last_slot[player] = time_slot
                            
                            # 从组中移除已安排的比赛
                            group.remove(match)
                            
                            # 如果该组的比赛都安排完了，标记为删除
                            if not group:
                                groups_to_remove.append(group_idx)
                            
                            break  # 这个组在当前时间段只安排一场
            
            # 删除已完成的组
            for idx in sorted(groups_to_remove, reverse=True):
                remaining_groups.pop(idx)
            
            # 如果当前时间段安排了比赛，添加到结果中
            if current_slot_matches:
                scheduled_matches.extend(current_slot_matches)
            
            # 进入下一个时间段
            time_slot += 1
            
            # 防止无限循环
            if time_slot > 100:
                print("警告：调度算法可能陷入循环")
                break
        
        return scheduled_matches
    
    def validate_schedule(self, matches: List[Dict]) -> List[str]:
        """验证赛程的合法性"""
        errors = []
        
        # 检查每个时间段的选手冲突
        time_slot_players = defaultdict(list)
        for match in matches:
            slot = match['timeSlot']
            players = match['teamA_Players'] + match['teamB_Players']
            
            for player in players:
                if player in time_slot_players[slot]:
                    errors.append(f"选手 {player} 在时间段 {slot} 有冲突")
                time_slot_players[slot].append(player)
        
        # 检查场地冲突
        time_court_usage = defaultdict(list)
        for match in matches:
            key = (match['timeSlot'], match['court'])
            time_court_usage[key].append(match['id'])
            
            if len(time_court_usage[key]) > 1:
                errors.append(f"时间段 {match['timeSlot']} 场地 {match['court']} 有冲突")
        
        return errors 