import { useState } from "react";
import * as Popover from "@radix-ui/react-popover";
import { Command } from "cmdk";
import { IconChevronDown } from "@/components/icons";

export interface OpcionCombo {
  id: string;
  label: string;
}

/**
 * Buscador desplegable (patrón shadcn: cmdk + Radix Popover), con la marca de
 * la app. Sustituye a los `<select>` largos: escribes para filtrar entre
 * cientos de opciones. Al elegir, llama `onPick(id)` y se cierra.
 */
export function Combobox({
  label,
  items,
  onPick,
  placeholder = "Buscar…",
  vacio = "Sin resultados.",
}: {
  label: string;
  items: OpcionCombo[];
  onPick: (id: string) => void;
  placeholder?: string;
  vacio?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-forge-dark hover:border-forge-orange"
        >
          {label}
          <IconChevronDown className="h-4 w-4 text-slate-400" />
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="start"
          sideOffset={6}
          className="z-[1300] w-[min(20rem,90vw)] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-card"
        >
          <Command
            filter={(value, search) =>
              value.toLowerCase().includes(search.toLowerCase()) ? 1 : 0
            }
          >
            <div className="border-b border-slate-100 px-3">
              <Command.Input
                autoFocus
                placeholder={placeholder}
                className="w-full bg-transparent py-2.5 text-sm text-forge-dark outline-none placeholder:text-slate-400"
              />
            </div>
            <Command.List className="max-h-64 overflow-y-auto p-1">
              <Command.Empty className="px-3 py-4 text-center text-sm text-slate-400">
                {vacio}
              </Command.Empty>
              {items.map((it) => (
                <Command.Item
                  key={it.id}
                  value={it.label}
                  onSelect={() => {
                    onPick(it.id);
                    setOpen(false);
                  }}
                  className="cursor-pointer rounded-lg px-3 py-2 text-sm text-forge-dark data-[selected=true]:bg-slate-100"
                >
                  {it.label}
                </Command.Item>
              ))}
            </Command.List>
          </Command>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
