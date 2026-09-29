import { Anchor, Code2, Network, Workflow, Smartphone, Layers, Lightbulb, type LucideIcon } from "lucide-react";

export const SERVICE_ICONS: Record<string, LucideIcon> = {
  anchor: Anchor,
  workflow: Workflow,
  code: Code2,
  network: Network,
  mobile: Smartphone,
  layers: Layers,
  bulb: Lightbulb,
};

export function ServiceIcon({ name, className = "h-5 w-5" }: { name: string; className?: string }) {
  const Icon = SERVICE_ICONS[name] ?? Code2;
  return <Icon className={className} aria-hidden />;
}
