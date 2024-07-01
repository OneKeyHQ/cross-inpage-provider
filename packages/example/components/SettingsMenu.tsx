import { Settings } from 'lucide-react';
import { Button } from './ui/button';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { useSettings } from '../hooks/useSettings';
import { Switch } from './ui/switch';
import { useToast } from './ui/use-toast';

const SwitchItem = ({
  label,
  id,
  checked,
  onChange,
  description,
}: {
  label: string;
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  description?: string;
}) => (
  <div className="flex flex-col space-y-2 py-3">
    <div className="flex items-center justify-between">
      <div className="space-y-0.5">
        <label
          htmlFor={id}
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          {label}
        </label>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </div>
      <Switch className='ml-4' id={id} checked={checked} onCheckedChange={onChange} />
    </div>
  </div>
);

export default function SettingsMenu() {
  const { settings, updateSetting } = useSettings();
  const { toast } = useToast();

  const handleSettingChange = (key: keyof typeof settings, value: boolean) => {
    updateSetting(key, value);
    toast({
      title: '设置已更新',
      description: `${key === 'autoConnect' ? '自动连接钱包' : key} 已${value ? '开启' : '关闭'}`,
    });
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="secondary"
          size="icon"
          className="fixed bottom-24 right-8 rounded-full z-[20] h-16 w-16"
          aria-label="打开设置菜单"
        >
          <Settings className="h-8 w-8" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-128 p-4">
        <h4 className="font-medium text-lg mb-4">设置</h4>
        <div className="space-y-2">
          <SwitchItem
            label="自动连接钱包"
            id="autoConnect"
            checked={settings.autoConnect}
            onChange={(checked) => handleSettingChange('autoConnect', checked)}
            description="Sol Standard、Sui Standard 始终自动链接，不受该选项控制"
          />
          {/* 可以在这里添加更多设置项 */}
        </div>
      </PopoverContent>
    </Popover>
  );
}
