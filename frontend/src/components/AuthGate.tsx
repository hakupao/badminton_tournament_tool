import { useState, type ReactNode } from 'react';
import { Button, Card, Form, Input, Result, Spin, Typography, message } from 'antd';
import { MailOutlined } from '@ant-design/icons';
import { useAuth } from '../auth/AuthProvider';

const { Title, Paragraph } = Typography;

interface AuthGateProps {
  children: ReactNode;
}

export const AuthGate = ({ children }: AuthGateProps) => {
  const { mode, isLoading, user, signInWithOtp } = useAuth();
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (mode === 'offline') {
    return <>{children}</>;
  }

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
        <Spin tip="正在加载登录状态..." size="large" />
      </div>
    );
  }

  if (user) {
    return <>{children}</>;
  }

  if (submittedEmail) {
    return (
      <Result
        status="success"
        title="登录邮件已发送"
        subTitle={`我们已向 ${submittedEmail} 发送一次性登录链接，请打开邮件完成登录。`}
        extra={[
          <Button key="resend" type="primary" onClick={() => setSubmittedEmail(null)}>
            使用其他邮箱
          </Button>,
        ]}
      />
    );
  }

  const handleFinish = async (values: { email: string }) => {
    setIsSubmitting(true);
    const error = await signInWithOtp(values.email);
    setIsSubmitting(false);
    if (error) {
      message.error(error.message);
      return;
    }
    message.success('登录邮件已发送，请查看邮箱。');
    setSubmittedEmail(values.email);
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
      <Card style={{ maxWidth: 420, width: '100%' }}>
        <Title level={3} style={{ textAlign: 'center' }}>
          登录以继续
        </Title>
        <Paragraph type="secondary" style={{ textAlign: 'center' }}>
          输入邮箱地址，我们会发送一次性登录链接。
        </Paragraph>
        <Form layout="vertical" onFinish={handleFinish}>
          <Form.Item
            label="邮箱"
            name="email"
            rules={[
              { required: true, message: '请输入邮箱地址' },
              { type: 'email', message: '请输入正确的邮箱格式' },
            ]}
          >
            <Input prefix={<MailOutlined />} placeholder="you@example.com" size="large" autoFocus />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block size="large" loading={isSubmitting}>
              发送登录链接
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default AuthGate;
