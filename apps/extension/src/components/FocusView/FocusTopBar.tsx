import { SettingsPanel } from '../common'

export function FocusTopBar() {
  return (
    <div className="flex justify-end items-center gap-2 p-6 relative z-10">
      <SettingsPanel />
    </div>
  )
}
