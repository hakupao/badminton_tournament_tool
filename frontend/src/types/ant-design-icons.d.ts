declare module '@ant-design/icons' {
  import { FC, SVGProps } from 'react';
  
  export interface IconProps extends SVGProps<SVGSVGElement> {
    spin?: boolean;
    rotate?: number;
    twoToneColor?: string;
  }
  
  export const DownloadOutlined: FC<IconProps>;
  // 如果需要其他图标，可以在这里添加
} 