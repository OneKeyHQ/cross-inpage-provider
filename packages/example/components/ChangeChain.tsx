import { registeredChains } from '../chains';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
type IChangeChainProps = {
  defaultChainId?: string;
};

export default function ChangeChain({ defaultChainId }: IChangeChainProps) {
  const supportChains = registeredChains.sort((a, b) => a.name.localeCompare(b.name));

  return (
    <Select
      onValueChange={(id) => {
        const chain = supportChains.find((chain) => chain.id === id);
        if (chain.target) {
          window.open(chain.href, chain.target);
        } else {
          window.location.href = chain.href;
        }
      }}
    >
      <SelectTrigger className="w-[80px] md:w-[160px]">
        <SelectValue placeholder="Change Chain" defaultValue={defaultChainId} />
      </SelectTrigger>
      <SelectContent>
        {supportChains.map((chain) => (
          <SelectItem key={chain.name} value={chain.id}>
            <div className="flex flex-row gap-2 min-h-8">
              <img alt={chain.icon} src={chain.icon} className="w-5 h-5 rounded-full" />
              <span className="font-medium">{chain.name}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
