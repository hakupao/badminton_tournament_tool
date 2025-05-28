import { createContext, useContext, useState, ReactNode } from 'react';
import { Match } from './types';

// 定义状态类型
interface AppState {
  matches: Match[];
  timeSlots: string[];
  setMatches: (matches: Match[]) => void;
  setTimeSlots: (timeSlots: string[]) => void;
  updateMatchResult: (matchId: string, result: Partial<Match>) => void;
}

// 创建Context
export const AppContext = createContext<AppState | undefined>(undefined);

// 从localStorage获取初始数据
const getInitialMatches = (): Match[] => {
  try {
    const storedMatches = localStorage.getItem('badminton_matches');
    return storedMatches ? JSON.parse(storedMatches) : [];
  } catch (error) {
    console.error('Error loading matches from localStorage:', error);
    return [];
  }
};

const getInitialTimeSlots = (): string[] => {
  try {
    const storedTimeSlots = localStorage.getItem('badminton_timeSlots');
    return storedTimeSlots ? JSON.parse(storedTimeSlots) : [];
  } catch (error) {
    console.error('Error loading timeSlots from localStorage:', error);
    return [];
  }
};

// Context Provider组件
export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [matches, setMatchesState] = useState<Match[]>(getInitialMatches);
  const [timeSlots, setTimeSlotsState] = useState<string[]>(getInitialTimeSlots);

  // 更新matches并保存到localStorage
  const setMatches = (newMatches: Match[]) => {
    setMatchesState(newMatches);
    localStorage.setItem('badminton_matches', JSON.stringify(newMatches));
  };

  // 更新timeSlots并保存到localStorage
  const setTimeSlots = (newTimeSlots: string[]) => {
    setTimeSlotsState(newTimeSlots);
    localStorage.setItem('badminton_timeSlots', JSON.stringify(newTimeSlots));
  };

  // 更新单个比赛结果
  const updateMatchResult = (matchId: string, result: Partial<Match>) => {
    const updatedMatches = matches.map(match => 
      match.id === matchId ? { ...match, ...result } : match
    );
    setMatches(updatedMatches);
  };

  return (
    <AppContext.Provider value={{ matches, timeSlots, setMatches, setTimeSlots, updateMatchResult }}>
      {children}
    </AppContext.Provider>
  );
};

// 自定义Hook，方便组件使用Context
export const useAppState = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppState must be used within an AppProvider');
  }
  return context;
}; 