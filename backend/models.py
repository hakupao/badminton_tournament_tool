from datetime import datetime
from typing import List, Optional, Dict, Any
from dataclasses import dataclass, field, asdict

@dataclass
class Player:
    """队员"""
    id: str
    teamId: str
    name: str
    gender: str  # 'M' 或 'F'
    skillLevel: int  # 1-n, 数字越小水平越高
    createdAt: datetime = field(default_factory=datetime.now)
    
    def to_dict(self) -> Dict[str, Any]:
        data = asdict(self)
        data['createdAt'] = self.createdAt.isoformat()
        return data

@dataclass
class Team:
    """队伍"""
    id: str
    name: str
    createdAt: datetime = field(default_factory=datetime.now)
    
    def to_dict(self) -> Dict[str, Any]:
        data = asdict(self)
        data['createdAt'] = self.createdAt.isoformat()
        return data

@dataclass
class Formation:
    """阵容 - MVP版本，固定3个项目：男双1、男双2、混双1"""
    id: str
    teamId: str
    type: str  # 'MD1', 'MD2', 'XD1'
    playerIds: List[str]  # 双打固定2个队员
    createdAt: datetime = field(default_factory=datetime.now)
    
    def to_dict(self) -> Dict[str, Any]:
        data = asdict(self)
        data['createdAt'] = self.createdAt.isoformat()
        return data

@dataclass
class Match:
    """比赛"""
    id: str
    round: int  # 轮次
    timeSlot: int  # 时间段
    court: int  # 场地号
    matchType: str  # 'MD1', 'MD2', 'XD1'
    teamA_Id: str
    teamB_Id: str
    teamA_Players: List[str]  # 队员ID列表
    teamB_Players: List[str]  # 队员ID列表
    status: str = 'pending'  # pending, ongoing, finished
    scores: List[Dict[str, int]] = field(default_factory=list)
    winner_TeamId: Optional[str] = None
    createdAt: datetime = field(default_factory=datetime.now)
    
    def to_dict(self) -> Dict[str, Any]:
        data = asdict(self)
        data['createdAt'] = self.createdAt.isoformat()
        return data

@dataclass
class Schedule:
    """赛程 - MVP版本只保存一个当前赛程"""
    id: str = 'current'
    matches: List[str] = field(default_factory=list)  # 比赛ID列表
    totalRounds: int = 0
    totalTimeSlots: int = 0
    courtsUsed: int = 0
    createdAt: datetime = field(default_factory=datetime.now)
    
    def to_dict(self) -> Dict[str, Any]:
        data = asdict(self)
        data['createdAt'] = self.createdAt.isoformat()
        return data 