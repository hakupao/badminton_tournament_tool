import React, { useState, useEffect } from 'react';
import { Card, Form, InputNumber, Select, Button, Space, message, Row, Col, Typography, Divider } from 'antd';
import { SettingOutlined, ClockCircleOutlined, TeamOutlined, EnvironmentOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;
const { Option } = Select;

interface TournamentConfig {
  teamCount: number;
  teamCapacity: number;
  formations: string[];
  courtCount: number;
  matchDuration: number; // 分钟
}

const TournamentSetup: React.FC = () => {
  const [form] = Form.useForm();
  const [config, setConfig] = useState<TournamentConfig>({
    teamCount: 4,
    teamCapacity: 6,
    formations: ['1+2', '3+4', '5+6'],
    courtCount: 2,
    matchDuration: 30,
  });
  const [totalTime, setTotalTime] = useState<{ hours: number; minutes: number }>({ hours: 0, minutes: 0 });

  // 生成队员数字选项
  const generatePlayerOptions = () => {
    const players = [];
    for (let i = 1; i <= config.teamCapacity; i++) {
      players.push(i);
    }
    return players;
  };

  // 计算总比赛时间
  const calculateTotalTime = () => {
    const { teamCount, formations, matchDuration, courtCount } = config;
    
    // 循环赛总场数：C(n,2) = n*(n-1)/2
    const totalTeamMatches = (teamCount * (teamCount - 1)) / 2;
    
    // 每场团体赛的比赛数量（阵容数量）
    const matchesPerTeamMatch = formations.length;
    
    // 总比赛场次
    const totalMatches = totalTeamMatches * matchesPerTeamMatch;
    
    // 总时间（分钟）
    const totalMinutes = (totalMatches * matchDuration) / courtCount;
    
    // 转换为小时和分钟
    const hours = Math.floor(totalMinutes / 60);
    const minutes = Math.round(totalMinutes % 60);
    
    setTotalTime({ hours, minutes });
  };

  // 配置改变时重新计算时间
  useEffect(() => {
    calculateTotalTime();
  }, [config]);

  // 保存配置
  const handleSave = async () => {
    try {
      await form.validateFields();
      
      // 保存到localStorage
      localStorage.setItem('tournamentConfig', JSON.stringify(config));
      
      message.success('比赛配置保存成功！');
    } catch (error) {
      message.error('请检查表单填写是否完整');
    }
  };

  // 加载已保存的配置
  useEffect(() => {
    const savedConfig = localStorage.getItem('tournamentConfig');
    if (savedConfig) {
      const parsed = JSON.parse(savedConfig);
      setConfig(parsed);
      form.setFieldsValue(parsed);
    }
  }, [form]);

  // 处理阵容设置变化
  const handleFormationChange = (value: string[]) => {
    setConfig(prev => ({ ...prev, formations: value }));
  };

  // 生成阵容选项
  const generateFormationOptions = () => {
    const options = [];
    const players = generatePlayerOptions();
    
    // 生成所有可能的双打组合
    for (let i = 0; i < players.length; i++) {
      for (let j = i + 1; j < players.length; j++) {
        options.push(`${players[i]}+${players[j]}`);
      }
    }
    
    return options;
  };

  return (
    <div>
      <Title level={2}>
        <SettingOutlined /> 比赛统筹
      </Title>
      
      <Form
        form={form}
        layout="vertical"
        initialValues={config}
        onValuesChange={(_, allValues) => {
          setConfig(prev => ({ ...prev, ...allValues }));
        }}
      >
        <Row gutter={24}>
          <Col span={12}>
            <Card title={<><TeamOutlined /> 队伍设置</>} style={{ marginBottom: 16 }}>
              <Form.Item
                name="teamCount"
                label="队伍数量"
                rules={[{ required: true, message: '请输入队伍数量' }]}
                extra="最多支持26支队伍（A-Z）"
              >
                <InputNumber
                  min={2}
                  max={26}
                  style={{ width: '100%' }}
                  placeholder="请输入队伍数量"
                />
              </Form.Item>
              
              <Form.Item
                name="teamCapacity"
                label="队伍容量"
                rules={[{ required: true, message: '请输入队伍容量' }]}
                extra="每支队伍的最大队员数"
              >
                <InputNumber
                  min={1}
                  max={20}
                  style={{ width: '100%' }}
                  placeholder="请输入队伍容量"
                />
              </Form.Item>
            </Card>
          </Col>
          
          <Col span={12}>
            <Card title={<><EnvironmentOutlined /> 场地与时间设置</>} style={{ marginBottom: 16 }}>
              <Form.Item
                name="courtCount"
                label="比赛场地数量"
                rules={[{ required: true, message: '请输入场地数量' }]}
              >
                <InputNumber
                  min={1}
                  max={10}
                  style={{ width: '100%' }}
                  placeholder="请输入场地数量"
                />
              </Form.Item>
              
              <Form.Item
                name="matchDuration"
                label="单场比赛时间（分钟）"
                rules={[{ required: true, message: '请输入比赛时间' }]}
                extra="预估的单场比赛平均时间"
              >
                <InputNumber
                  min={10}
                  max={120}
                  style={{ width: '100%' }}
                  placeholder="请输入比赛时间"
                />
              </Form.Item>
            </Card>
          </Col>
        </Row>
        
        <Card title="阵容设置" style={{ marginBottom: 16 }}>
          <Form.Item
            name="formations"
            label="比赛阵容"
            rules={[{ required: true, message: '请选择比赛阵容' }]}
            extra="选择团体赛中的比赛位置组合，例如：1+2表示第1号和第2号队员组成双打"
          >
            <Select
              mode="multiple"
              placeholder="请选择阵容组合"
              style={{ width: '100%' }}
              onChange={handleFormationChange}
            >
              {generateFormationOptions().map(option => (
                <Option key={option} value={option}>
                  {option}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Card>
        
        <Card title={<><ClockCircleOutlined /> 比赛时间估算</>}>
          <Row gutter={16} align="middle">
            <Col span={12}>
              <div style={{ fontSize: 16 }}>
                <Text strong>循环赛团体场数：</Text>
                <Text>{(config.teamCount * (config.teamCount - 1)) / 2} 场</Text>
              </div>
              <div style={{ fontSize: 16, marginTop: 8 }}>
                <Text strong>每场团体赛比赛数：</Text>
                <Text>{config.formations.length} 场</Text>
              </div>
              <div style={{ fontSize: 16, marginTop: 8 }}>
                <Text strong>总比赛场次：</Text>
                <Text>{((config.teamCount * (config.teamCount - 1)) / 2) * config.formations.length} 场</Text>
              </div>
            </Col>
            <Col span={12}>
              <div style={{ textAlign: 'center', padding: '20px', background: '#f0f2f5', borderRadius: 8 }}>
                <Text style={{ fontSize: 14, color: '#666' }}>预计总比赛时间</Text>
                <div style={{ fontSize: 32, fontWeight: 'bold', color: '#1890ff', marginTop: 8 }}>
                  {totalTime.hours} 小时 {totalTime.minutes} 分钟
                </div>
              </div>
            </Col>
          </Row>
        </Card>
        
        <Divider />
        
        <Space style={{ width: '100%', justifyContent: 'center' }}>
          <Button type="primary" size="large" onClick={handleSave}>
            保存配置
          </Button>
        </Space>
      </Form>
    </div>
  );
};

export default TournamentSetup; 