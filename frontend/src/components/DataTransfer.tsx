import React, { useState, useRef } from 'react';
import { exportData, importData } from '../utils';
import { useAppState } from '../store';

const DataTransfer: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<{
    message: string;
    type: 'success' | 'error' | 'info' | '';
  }>({ message: '', type: '' });
  const { setMatches, setTimeSlots } = useAppState();

  const handleExport = () => {
    const result = exportData();
    if (result.success) {
      setImportStatus({ message: result.message, type: 'success' });
    } else {
      setImportStatus({ message: result.message, type: 'error' });
    }
    
    // 5秒后清除消息
    setTimeout(() => {
      setImportStatus({ message: '', type: '' });
    }, 5000);
  };

  const handleImportClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setImportStatus({ message: '正在导入数据...', type: 'info' });
      const result = await importData(file);
      
      if (result.success) {
        setImportStatus({ message: result.message, type: 'success' });
        
        // 重新加载数据到应用状态
        const matches = JSON.parse(localStorage.getItem('badminton_matches') || '[]');
        const timeSlots = JSON.parse(localStorage.getItem('badminton_timeSlots') || '[]');
        setMatches(matches);
        setTimeSlots(timeSlots);
      } else {
        setImportStatus({ message: result.message, type: 'error' });
      }
    } catch (error) {
      setImportStatus({ 
        message: `导入失败: ${error instanceof Error ? error.message : '未知错误'}`, 
        type: 'error' 
      });
    }
    
    // 清除文件输入
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    
    // 5秒后清除消息
    setTimeout(() => {
      setImportStatus({ message: '', type: '' });
    }, 5000);
  };

  return (
    <div className="data-transfer-container">
      <h3>数据迁移</h3>
      <div className="data-transfer-buttons">
        <button 
          onClick={handleExport}
          className="export-button"
        >
          导出数据
        </button>
        <button 
          onClick={handleImportClick}
          className="import-button"
        >
          导入数据
        </button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".json"
          style={{ display: 'none' }}
        />
      </div>
      
      {importStatus.message && (
        <div className={`status-message ${importStatus.type}`}>
          {importStatus.message}
        </div>
      )}
      
      <div className="data-transfer-help">
        <p>您可以将数据导出为JSON文件，然后在其他设备上导入使用。</p>
        <p>导出的数据包含所有比赛信息、时间段设置以及队员姓名信息。</p>
      </div>
      
      <style jsx>{`
        .data-transfer-container {
          padding: 15px;
          border: 1px solid #eaeaea;
          border-radius: 8px;
          margin-bottom: 20px;
          background-color: #f9f9f9;
        }
        
        h3 {
          margin-top: 0;
          color: #333;
        }
        
        .data-transfer-buttons {
          display: flex;
          gap: 10px;
          margin-bottom: 15px;
        }
        
        button {
          padding: 8px 16px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 500;
          transition: background-color 0.2s;
        }
        
        .export-button {
          background-color: #4caf50;
          color: white;
        }
        
        .export-button:hover {
          background-color: #45a049;
        }
        
        .import-button {
          background-color: #2196f3;
          color: white;
        }
        
        .import-button:hover {
          background-color: #0b7dda;
        }
        
        .status-message {
          padding: 10px;
          border-radius: 4px;
          margin-bottom: 15px;
        }
        
        .success {
          background-color: #dff0d8;
          color: #3c763d;
          border: 1px solid #d6e9c6;
        }
        
        .error {
          background-color: #f2dede;
          color: #a94442;
          border: 1px solid #ebccd1;
        }
        
        .info {
          background-color: #d9edf7;
          color: #31708f;
          border: 1px solid #bce8f1;
        }
        
        .data-transfer-help {
          font-size: 0.9em;
          color: #666;
        }
        
        .data-transfer-help p {
          margin: 5px 0;
        }
      `}</style>
    </div>
  );
};

export default DataTransfer; 