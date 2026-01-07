import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Form,
  Input,
  Button,
  Select,
  Switch,
  Space,
  Typography,
  Divider,
  message,
} from 'antd';
import { ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons';
import { STORAGE_KEYS, DEFAULT_SERVER_URL } from '../../utils/constants';
import './index.less';

const { Title, Text } = Typography;
const { Option } = Select;

interface SettingsFormValues {
  serverUrl: string;
  defaultResolution: string;
  defaultFrameRate: number;
  hardwareAcceleration: boolean;
  theme: 'light' | 'dark';
}

const Settings: React.FC = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm<SettingsFormValues>();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  // 加载设置
  const loadSettings = () => {
    const serverUrl = localStorage.getItem(STORAGE_KEYS.SERVER_URL) || DEFAULT_SERVER_URL;
    const theme = (localStorage.getItem(STORAGE_KEYS.THEME) || 'light') as 'light' | 'dark';

    form.setFieldsValue({
      serverUrl,
      defaultResolution: '1080p',
      defaultFrameRate: 30,
      hardwareAcceleration: true,
      theme,
    });
  };

  // 保存设置
  const handleSave = async (values: SettingsFormValues) => {
    setLoading(true);
    try {
      // 保存到本地存储
      localStorage.setItem(STORAGE_KEYS.SERVER_URL, values.serverUrl);
      localStorage.setItem(STORAGE_KEYS.THEME, values.theme);

      message.success('设置已保存');
      setTimeout(() => {
        navigate('/');
      }, 1000);
    } catch (error: any) {
      message.error('保存设置失败: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // 重置设置
  const handleReset = () => {
    form.setFieldsValue({
      serverUrl: DEFAULT_SERVER_URL,
      defaultResolution: '1080p',
      defaultFrameRate: 30,
      hardwareAcceleration: true,
      theme: 'light',
    });
    message.info('已恢复默认设置');
  };

  return (
    <div className="settings-page">
      <div className="settings-container">
        <div className="settings-header">
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/')}
            type="text"
          >
            返回
          </Button>
          <Title level={3}>设置</Title>
        </div>

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSave}
          className="settings-form"
        >
          {/* 网络设置 */}
          <Card title="网络设置" className="settings-card">
            <Form.Item
              label="服务器地址"
              name="serverUrl"
              rules={[{ required: true, message: '请输入服务器地址' }]}
            >
              <Input placeholder="http://localhost:3000" />
            </Form.Item>
          </Card>

          {/* 视频设置 */}
          <Card title="视频设置" className="settings-card">
            <Form.Item
              label="默认分辨率"
              name="defaultResolution"
              rules={[{ required: true, message: '请选择默认分辨率' }]}
            >
              <Select>
                <Option value="720p">720p (1280x720)</Option>
                <Option value="1080p">1080p (1920x1080)</Option>
                <Option value="1440p">2K (2560x1440)</Option>
                <Option value="2160p">4K (3840x2160)</Option>
              </Select>
            </Form.Item>

            <Form.Item
              label="默认帧率"
              name="defaultFrameRate"
              rules={[{ required: true, message: '请选择默认帧率' }]}
            >
              <Select>
                <Option value={15}>15 FPS</Option>
                <Option value={24}>24 FPS</Option>
                <Option value={30}>30 FPS</Option>
                <Option value={60}>60 FPS</Option>
                <Option value={120}>120 FPS</Option>
              </Select>
            </Form.Item>

            <Form.Item
              label="硬件加速"
              name="hardwareAcceleration"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
            <Text type="secondary" style={{ fontSize: 12 }}>
              启用硬件加速可以提升性能，但某些设备可能不支持
            </Text>
          </Card>

          {/* 外观设置 */}
          <Card title="外观设置" className="settings-card">
            <Form.Item
              label="主题"
              name="theme"
              rules={[{ required: true, message: '请选择主题' }]}
            >
              <Select>
                <Option value="light">亮色</Option>
                <Option value="dark">暗色</Option>
              </Select>
            </Form.Item>
          </Card>

          <Divider />

          {/* 操作按钮 */}
          <Space size="middle" style={{ width: '100%', justifyContent: 'flex-end' }}>
            <Button onClick={handleReset}>恢复默认</Button>
            <Button
              type="primary"
              htmlType="submit"
              icon={<SaveOutlined />}
              loading={loading}
            >
              保存设置
            </Button>
          </Space>
        </Form>
      </div>
    </div>
  );
};

export default Settings;
