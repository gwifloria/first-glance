import { SettingsPanel } from '../common/SettingsPanel'

export function FocusTopBar() {
  return (
    <div className="flex justify-end p-6 relative z-10">
      <SettingsPanel />
    </div>
  )
}
