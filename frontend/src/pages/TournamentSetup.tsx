import React, { useEffect, useMemo, useState } from 'react';
import {
  Card,
  Form,
  InputNumber,
  Select,
  Button,
  Space,
  message,
  Row,
  Col,
  Typography,
  Divider,
  Spin,
} from 'antd';
import { SettingOutlined, ClockCircleOutlined, TeamOutlined, EnvironmentOutlined } from '@ant-design/icons';
import { useUserDataService } from '../hooks/useUserDataService';
import type { TournamentConfig } from '../types';

const { Title, Text } = Typography;
const { Option } = Select;

const defaultConfig: TournamentConfig = {
  teamCount: 4,
  teamCapacity: 6,
  formations: ['1+2', '3+4', '5+6'],
  courtCount: 2,
  matchDuration: 30,
};

const TournamentSetup: React.FC = () => {
  const [form] = Form.useForm<TournamentConfig>();
  const { loadTournamentConfig, saveTournamentConfig } = useUserDataService();
  const [config, setConfig] = useState<TournamentConfig>(defaultConfig);
  const [totalTime, setTotalTime] = useState<{ hours: number; minutes: number }>({ hours: 0, minutes: 0 });
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [saving, setSaving] = useState(false);

  const playerOptions = useMemo(() => {
    return Array.from({ length: config.teamCapacity }, (_, index) => index + 1);
  }, [config.teamCapacity]);

  useEffect(() => {
    const { teamCount, formations, matchDuration, courtCount } = config;
    const totalTeamMatches = (teamCount * (teamCount - 1)) / 2;
    const matchesPerTeamMatch = formations.length;
    const totalMatches = totalTeamMatches * matchesPerTeamMatch;
    const totalMinutes = (totalMatches * matchDuration) / Math.max(courtCount, 1);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = Math.round(totalMinutes % 60);
    setTotalTime({ hours, minutes });
  }, [config]);

  useEffect(() => {
    let active = true;
    setLoadingConfig(true);
    loadTournamentConfig()
      .then((result) => {
        if (!active) return;
        if (result.data) {
          setConfig(result.data);
          form.setFieldsValue(result.data);
        } else {
          form.setFieldsValue(defaultConfig);
        }
      })
      .catch(() => {
        if (active) {
          message.error('加载比赛配置失败，已使用默认模板。');
          form.setFieldsValue(defaultConfig);
        }
      })
      .finally(() => {
        if (active) {
          setLoadingConfig(false);
        }
      });
    return () => {
      active = false;
    };
  }, [form, loadTournamentConfig]);

  const handleSave = async () => {
    try {
      await form.validateFields();
      setSaving(true);
      const result = await saveTournamentConfig(config);
      if (result.error) {
        message.error(result.error.message);
      } else {
        message.success('比赛配置保存成功！');
      }
    } catch {
      message.error('请检查表单填写是否完整');
    } finally {
      setSaving(false);
    }
  };

  const handleFormationChange = (value: string[]) => {
    setConfig((prev) => ({ ...prev, formations: value }));
  };

  const formationOptions = useMemo(() => {
    const options: string[] = [];
    for (let i = 0; i < playerOptions.length; i++) {
      for (let j = i + 1; j < playerOptions.length; j++) {
        options.push(`${playerOptions[i]}+${playerOptions[j]}`);
      }
    }
    return options;
  }, [playerOptions]);

  return (
    <div>
      <Title level={2}>
        <SettingOutlined /> 比赛统筹
      </Title>

      <Spin spinning={loadingConfig}>
        <Form
          form={form}
          layout="vertical"
          initialValues={config}
          onValuesChange={(_, allValues) => {
            setConfig((prev) => ({ ...prev, ...allValues }));
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
                  <InputNumber min={2} max={26} style={{ width: '100%' }} placeholder="请输入队伍数量" />
                </Form.Item>

                <Form.Item
                  name="teamCapacity"
                  label="队伍容量"
                  rules={[{ required: true, message: '请输入队伍容量' }]}
                  extra="每支队伍的最大队员数"
                >
                  <InputNumber min={1} max={20} style={{ width: '100%' }} placeholder="请输入队伍容量" />
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
                  <InputNumber min={1} max={10} style={{ width: '100%' }} placeholder="请输入场地数量" />
                </Form.Item>

                <Form.Item
                  name="matchDuration"
                  label="单场比赛时间（分钟）"
                  rules={[{ required: true, message: '请输入比赛时间' }]}
                  extra="预估的单场比赛平均时间"
                >
                  <InputNumber min={10} max={120} style={{ width: '100%' }} placeholder="请输入比赛时间" />
                </Form.Item>
              </Card>
            </Col>
          </Row>

          <Card title={<><SettingOutlined /> 阵容配置</>} style={{ marginBottom: 16 }}>
            <Form.Item
              name="formations"
              label="选择阵容组合"
              rules={[{ required: true, message: '请至少选择一个阵容组合' }]}
            >
              <Select
                mode="multiple"
                placeholder="请选择阵容组合"
                onChange={handleFormationChange}
                value={config.formations}
              >
                {formationOptions.map((option) => (
                  <Option key={option} value={option}>
                    {option}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Card>
        </Form>
      </Spin>

      <Card title={<><ClockCircleOutlined /> 赛程预估</>}>
        <Row gutter={16}>
          <Col span={12}>
            <Space direction="vertical">
              <Text>总场次（团体赛 × 阵容）</Text>
              <Text strong>
                {config.teamCount ? (config.teamCount * (config.teamCount - 1)) / 2 : 0} × {config.formations.length}
              </Text>
            </Space>
          </Col>
          <Col span={12}>
            <Space direction="vertical">
              <Text>预计比赛总时长</Text>
              <Text strong>
                {totalTime.hours} 小时 {totalTime.minutes} 分钟
              </Text>
            </Space>
          </Col>
        </Row>
        <Divider />
        <Space>
          <Button type="primary" onClick={handleSave} icon={<SettingOutlined />} loading={saving} disabled={loadingConfig}>
            保存配置
          </Button>
        </Space>
      </Card>
    </div>
  );
};

export default TournamentSetup;
