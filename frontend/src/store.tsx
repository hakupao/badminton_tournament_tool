import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// 定义状态类型
interface AppState {
  matches: any[];
  timeSlots: string[];
  setMatches: (matches: any[]) => void;
  setTimeSlots: (timeSlots: string[]) => void;
  updateMatchResult: (matchId: string, result: any) => void;
}

// 创建Context
export const AppContext = createContext<AppState | undefined>(undefined);

// 从localStorage获取初始数据
const getInitialMatches = (): any[] => {
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
  const [matches, setMatchesState] = useState<any[]>(getInitialMatches);
  const [timeSlots, setTimeSlotsState] = useState<string[]>(getInitialTimeSlots);

  // 更新matches并保存到localStorage
  const setMatches = (newMatches: any[]) => {
    setMatchesState(newMatches);
    localStorage.setItem('badminton_matches', JSON.stringify(newMatches));
    
    // 同时同步到后端
    try {
      fetch('/api/matches', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ matches: newMatches, timeSlots }),
      });
    } catch (error) {
      console.error('Failed to sync matches to backend:', error);
    }
  };

  // 更新timeSlots并保存到localStorage
  const setTimeSlots = (newTimeSlots: string[]) => {
    setTimeSlotsState(newTimeSlots);
    localStorage.setItem('badminton_timeSlots', JSON.stringify(newTimeSlots));
    
    // 同时同步到后端
    try {
      fetch('/api/matches', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ matches, timeSlots: newTimeSlots }),
      });
    } catch (error) {
      console.error('Failed to sync timeSlots to backend:', error);
    }
  };

  // 更新单个比赛结果
  const updateMatchResult = (matchId: string, result: any) => {
    const updatedMatches = matches.map(match => 
      match.id === matchId ? { ...match, ...result } : match
    );
    setMatches(updatedMatches);
  };

  // 当组件挂载时，将数据同步到后端
  useEffect(() => {
    if (matches.length > 0 || timeSlots.length > 0) {
      try {
        fetch('/api/matches', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ matches, timeSlots }),
        });
      } catch (error) {
        console.error('Failed to sync data to backend on mount:', error);
      }
    }
  }, []);

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