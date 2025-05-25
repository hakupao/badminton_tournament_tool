import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Space, message, Popconfirm } from 'antd';
import { PlusOutlined, DeleteOutlined, TeamOutlined } from '@ant-design/icons';
import { Team, Player } from '../types';
import { teamApi, playerApi } from '../api';

const TeamManagement: React.FC = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(false);
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [isPlayerModalOpen, setIsPlayerModalOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [form] = Form.useForm();
  const [playerForm] = Form.useForm();

  // 加载队伍列表
  const loadTeams = async () => {
    setLoading(true);
    try {
      const response = await teamApi.getAll();
      setTeams(response.data);
    } catch (error) {
      message.error('加载队伍失败');
    } finally {
      setLoading(false);
    }
  };

  // 加载队员列表
  const loadPlayers = async (teamId: string) => {
    try {
      const response = await playerApi.getByTeam(teamId);
      setPlayers(response.data);
    } catch (error) {
      message.error('加载队员失败');
    }
  };

  useEffect(() => {
    loadTeams();
  }, []);

  // 创建队伍
  const handleCreateTeam = async (values: { name: string }) => {
    try {
      await teamApi.create(values.name);
      message.success('队伍创建成功');
      setIsTeamModalOpen(false);
      form.resetFields();
      loadTeams();
    } catch (error) {
      message.error('创建队伍失败');
    }
  };

  // 删除队伍
  const handleDeleteTeam = async (id: string) => {
    try {
      await teamApi.delete(id);
      message.success('队伍删除成功');
      loadTeams();
    } catch (error) {
      message.error('删除队伍失败');
    }
  };

  // 添加队员
  const handleAddPlayer = async (values: any) => {
    if (!selectedTeam) return;
    
    try {
      await playerApi.create({
        teamId: selectedTeam.id,
        name: values.name,
        gender: values.gender,
        skillLevel: parseInt(values.skillLevel),
      });
      message.success('队员添加成功');
      setIsPlayerModalOpen(false);
      playerForm.resetFields();
      loadPlayers(selectedTeam.id);
    } catch (error) {
      message.error('添加队员失败');
    }
  };

  // 删除队员
  const handleDeletePlayer = async (id: string) => {
    try {
      await playerApi.delete(id);
      message.success('队员删除成功');
      if (selectedTeam) {
        loadPlayers(selectedTeam.id);
      }
    } catch (error) {
      message.error('删除队员失败');
    }
  };

  const teamColumns = [
    {
      title: '队伍名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (text: string) => new Date(text).toLocaleString('zh-CN'),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: Team) => (
        <Space size="middle">
          <Button
            type="link"
            icon={<TeamOutlined />}
            onClick={() => {
              setSelectedTeam(record);
              loadPlayers(record.id);
            }}
          >
            查看队员
          </Button>
          <Popconfirm
            title="确定删除该队伍吗？"
            description="删除后该队伍的所有队员和阵容也将被删除"
            onConfirm={() => handleDeleteTeam(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const playerColumns = [
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '性别',
      dataIndex: 'gender',
      key: 'gender',
      render: (gender: string) => gender === 'M' ? '男' : '女',
    },
    {
      title: '技术水平',
      dataIndex: 'skillLevel',
      key: 'skillLevel',
      render: (level: number) => `等级 ${level}`,
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: Player) => (
        <Popconfirm
          title="确定删除该队员吗？"
          onConfirm={() => handleDeletePlayer(record.id)}
          okText="确定"
          cancelText="取消"
        >
          <Button type="link" danger size="small">
            删除
          </Button>
        </Popconfirm>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setIsTeamModalOpen(true)}
        >
          创建队伍
        </Button>
      </div>

      <Table
        columns={teamColumns}
        dataSource={teams}
        loading={loading}
        rowKey="id"
        pagination={false}
      />

      {selectedTeam && (
        <div style={{ marginTop: 32 }}>
          <h3>{selectedTeam.name} - 队员列表</h3>
          <div style={{ marginBottom: 16 }}>
            <Button
              type="primary"
              size="small"
              icon={<PlusOutlined />}
              onClick={() => setIsPlayerModalOpen(true)}
            >
              添加队员
            </Button>
          </div>
          <Table
            columns={playerColumns}
            dataSource={players}
            rowKey="id"
            pagination={false}
            size="small"
          />
        </div>
      )}

      {/* 创建队伍对话框 */}
      <Modal
        title="创建队伍"
        open={isTeamModalOpen}
        onCancel={() => {
          setIsTeamModalOpen(false);
          form.resetFields();
        }}
        footer={null}
      >
        <Form form={form} onFinish={handleCreateTeam} layout="vertical">
          <Form.Item
            name="name"
            label="队伍名称"
            rules={[{ required: true, message: '请输入队伍名称' }]}
          >
            <Input placeholder="请输入队伍名称" />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                创建
              </Button>
              <Button onClick={() => setIsTeamModalOpen(false)}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 添加队员对话框 */}
      <Modal
        title={`添加队员 - ${selectedTeam?.name}`}
        open={isPlayerModalOpen}
        onCancel={() => {
          setIsPlayerModalOpen(false);
          playerForm.resetFields();
        }}
        footer={null}
      >
        <Form form={playerForm} onFinish={handleAddPlayer} layout="vertical">
          <Form.Item
            name="name"
            label="姓名"
            rules={[{ required: true, message: '请输入队员姓名' }]}
          >
            <Input placeholder="请输入队员姓名" />
          </Form.Item>
          <Form.Item
            name="gender"
            label="性别"
            rules={[{ required: true, message: '请选择性别' }]}
          >
            <Input.Group compact>
              <Button
                type={playerForm.getFieldValue('gender') === 'M' ? 'primary' : 'default'}
                onClick={() => playerForm.setFieldsValue({ gender: 'M' })}
              >
                男
              </Button>
              <Button
                type={playerForm.getFieldValue('gender') === 'F' ? 'primary' : 'default'}
                onClick={() => playerForm.setFieldsValue({ gender: 'F' })}
              >
                女
              </Button>
            </Input.Group>
          </Form.Item>
          <Form.Item
            name="skillLevel"
            label="技术水平"
            rules={[{ required: true, message: '请输入技术水平' }]}
          >
            <Input type="number" min={1} placeholder="数字越小水平越高，如：1、2、3" />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                添加
              </Button>
              <Button onClick={() => setIsPlayerModalOpen(false)}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default TeamManagement; 