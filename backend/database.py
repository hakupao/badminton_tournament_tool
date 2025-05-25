from pymongo import MongoClient
from pymongo.collection import Collection
from typing import Optional, List, Dict, Any
import uuid
from datetime import datetime
from config import Config

class Database:
    def __init__(self):
        self.client = MongoClient(Config.MONGODB_URI)
        self.db = self.client[Config.DATABASE_NAME]
        
        # 集合
        self.teams: Collection = self.db.teams
        self.players: Collection = self.db.players
        self.formations: Collection = self.db.formations
        self.matches: Collection = self.db.matches
        self.schedules: Collection = self.db.schedules
    
    def generate_id(self) -> str:
        """生成唯一ID"""
        return str(uuid.uuid4())
    
    # 队伍操作
    def create_team(self, name: str) -> Dict[str, Any]:
        team = {
            'id': self.generate_id(),
            'name': name,
            'createdAt': datetime.now()
        }
        self.teams.insert_one(team)
        return team
    
    def get_all_teams(self) -> List[Dict[str, Any]]:
        return list(self.teams.find({}, {'_id': 0}))
    
    def get_team(self, team_id: str) -> Optional[Dict[str, Any]]:
        return self.teams.find_one({'id': team_id}, {'_id': 0})
    
    def delete_team(self, team_id: str) -> bool:
        # 删除队伍的同时删除相关队员和阵容
        self.players.delete_many({'teamId': team_id})
        self.formations.delete_many({'teamId': team_id})
        result = self.teams.delete_one({'id': team_id})
        return result.deleted_count > 0
    
    # 队员操作
    def create_player(self, team_id: str, name: str, gender: str, skill_level: int) -> Dict[str, Any]:
        player = {
            'id': self.generate_id(),
            'teamId': team_id,
            'name': name,
            'gender': gender,
            'skillLevel': skill_level,
            'createdAt': datetime.now()
        }
        self.players.insert_one(player)
        return player
    
    def get_team_players(self, team_id: str) -> List[Dict[str, Any]]:
        return list(self.players.find({'teamId': team_id}, {'_id': 0}))
    
    def get_player(self, player_id: str) -> Optional[Dict[str, Any]]:
        return self.players.find_one({'id': player_id}, {'_id': 0})
    
    def update_player(self, player_id: str, updates: Dict[str, Any]) -> bool:
        result = self.players.update_one(
            {'id': player_id},
            {'$set': updates}
        )
        return result.modified_count > 0
    
    def delete_player(self, player_id: str) -> bool:
        result = self.players.delete_one({'id': player_id})
        return result.deleted_count > 0
    
    # 阵容操作
    def create_formation(self, team_id: str, formation_type: str, player_ids: List[str]) -> Dict[str, Any]:
        # 先删除该队伍同类型的旧阵容
        self.formations.delete_one({'teamId': team_id, 'type': formation_type})
        
        formation = {
            'id': self.generate_id(),
            'teamId': team_id,
            'type': formation_type,
            'playerIds': player_ids,
            'createdAt': datetime.now()
        }
        self.formations.insert_one(formation)
        return formation
    
    def get_team_formations(self, team_id: str) -> List[Dict[str, Any]]:
        return list(self.formations.find({'teamId': team_id}, {'_id': 0}))
    
    def get_formation(self, formation_id: str) -> Optional[Dict[str, Any]]:
        return self.formations.find_one({'id': formation_id}, {'_id': 0})
    
    # 比赛操作
    def create_match(self, match_data: Dict[str, Any]) -> Dict[str, Any]:
        match_data['id'] = self.generate_id()
        match_data['createdAt'] = datetime.now()
        self.matches.insert_one(match_data)
        return match_data
    
    def get_all_matches(self) -> List[Dict[str, Any]]:
        return list(self.matches.find({}, {'_id': 0}).sort([('timeSlot', 1), ('court', 1)]))
    
    def update_match_score(self, match_id: str, scores: List[Dict[str, int]], winner_team_id: Optional[str]) -> bool:
        result = self.matches.update_one(
            {'id': match_id},
            {'$set': {
                'scores': scores,
                'winner_TeamId': winner_team_id,
                'status': 'finished' if winner_team_id else 'ongoing'
            }}
        )
        return result.modified_count > 0
    
    # 赛程操作
    def save_schedule(self, match_ids: List[str], total_rounds: int, total_time_slots: int, courts_used: int) -> Dict[str, Any]:
        # MVP版本只保存一个赛程
        schedule = {
            'id': 'current',
            'matches': match_ids,
            'totalRounds': total_rounds,
            'totalTimeSlots': total_time_slots,
            'courtsUsed': courts_used,
            'createdAt': datetime.now()
        }
        
        # 删除旧赛程和比赛
        self.schedules.delete_many({})
        self.matches.delete_many({})
        
        self.schedules.insert_one(schedule)
        return schedule
    
    def get_current_schedule(self) -> Optional[Dict[str, Any]]:
        return self.schedules.find_one({'id': 'current'}, {'_id': 0})
    
    def clear_all_data(self):
        """清空所有数据 - 仅用于测试"""
        self.teams.delete_many({})
        self.players.delete_many({})
        self.formations.delete_many({})
        self.matches.delete_many({})
        self.schedules.delete_many({})

# 创建数据库实例
db = Database() 